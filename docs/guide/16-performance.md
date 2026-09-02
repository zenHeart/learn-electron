# 性能优化

> **一句话本质**：桌面应用的性能 = 内存不涨 + 启动够快 + 画面不卡——三个目标对应三套完全不同的测量与治理手段，混为一谈是性能工作失败的开始。

读完本章你会获得：多进程内存的正确口径与 API 全景、一套生产级「三支柱」内存监控体系、启动性能的拆解埋点法、GPU/合成层问题的治理工具箱（含没有官方 API 时的实战技巧），以及「后台运行」应用的降载策略。

## 心智模型：三类性能，三条战线

```mermaid
flowchart LR
    P[桌面应用性能] --> M[内存<br/>泄漏 / 膨胀]
    P --> S[启动<br/>冷启动 / 热启动]
    P --> F[流畅度<br/>掉帧 / 卡顿 / GPU 崩溃]
    M --> M1[指标采集 + 阈值告警 + 准入]
    S --> S1[分段埋点 + 逐段消灭]
    F --> F1[trace 定位 + 合成层治理]
```

## 一、内存：先搞对口径

### 多进程架构下，「应用占多少内存」怎么算

Electron 是多进程的：主进程、每窗口一个渲染进程、GPU 进程、网络服务进程各自独立。任务管理器里你看到的是**一组进程**。

关键概念——working set 的三分法：

| 口径 | 含义 | 用途 |
|---|---|---|
| **private working set** | 仅该进程独占的物理内存 | **进程内存的基准口径**：多进程间不重复计算 |
| sharable | 可共享（共享库等），别进程已驻留部分不计 | 理解「为什么两个窗口没有翻倍」 |
| shared | 实际已共享部分 | 分析总量时避免重复统计 |

::: exp 实战经验
①评估「应用总内存」用 private working set 求和——把 shared 加进去会把同一块内存数 N 次。②Windows 任务管理器显示的是 private bytes（含已换出），mac 活动监视器是 working set——跨平台对比要注明口径。③`getAppMetrics` 的返回值与任务管理器有常量级偏移（各进程十几 MB 的固定差），做「与用户实际感受对齐」的看板时先校准基准。
:::

### 内存 API 全景（按进程分层）

**Node 层（主/渲染/preload 通用）**：

```js
process.memoryUsage()
// heapUsed  JS 堆已用 —— V8 管理的对象，泄漏排查主指标
// heapTotal JS 堆总量
// rss       进程驻留物理内存 —— 含 native，只会涨很难跌（OS 惰性回收）

const v8 = require('v8')
v8.getHeapStatistics()          // 更细的堆统计
new v8.GCProfiler().start()     // GC 耗时序列化导出：分析 GC 压力
process.on('warning', w => {})  // MaxListenersExceededWarning 常是泄漏前兆
```

**主进程专属**：

```js
app.getAppMetrics()
// 返回每个进程的 ProcessMetric：
// process.type = 'Browser' | 'Renderer' | 'GPU' ...
// memory.workingSetSize / peakWorkingSetSize（KB）
// cpu.percentCPUUsage  —— CPU 火苗
// pid + creationTime   —— 注意：pid 会被 OS 复用，
//                          「pid + creationTime」才是进程唯一标识

app.getSystemMemoryInfo()
// free / total / swapTotal / swapFree
// swap 持续下降 = 系统级内存压力，别只盯自己进程
```

**渲染进程专属**：

```js
performance.memory            // usedJSHeapSize 等（需--enable-precise-memory-info 更准）
require('electron').webFrame.getResourceUsage()  // 缓存/编码缓存占用量
// Blink 层视角：document 计数、资源缓存、JS 编码缓存
```

### 三支柱监控体系

生产环境内存治理的完整架构——**常态监控 + 异常采集 + 准入预检**，三者缺一不可：

```text
支柱一 · 常态监控（知道"正常"长什么样）
  主进程每 5 分钟轮询 getAppMetrics，渲染层每 10 分钟上报自身
  → 建立基线：各进程内存 P50/P90 曲线
  → 告警只对"偏离基线"触发，而不是拍脑袋的绝对值

支柱二 · 异常采集（出事时自动拿到证据）
  事件驱动：render-process-gone 的 reason === 'oom'、
           child-process-gone、uncaughtException
  阈值驱动：主进程超警戒线（示例阈值：主 500MB / 渲染 800MB）触发
           一次 detailed 快照上报（getProcessMemoryInfo + 渲染层资源用量）

支柱三 · 准入预检（防止劣化合入）
  CI 跑 memlab 类工具：标准操作序列跑 N 轮，堆增量断言
  → 新代码引入泄漏在 MR 阶段拦截，而不是上线后
```

::: exp 实战经验
①轮询频率别太高：5 分钟粒度足够看趋势，秒级轮询本身就有 CPU 成本且数据毛刺严重。②多开识别：同一用户开多个窗口时，渲染进程数 >1，内存数据要「打标」区分单开/多开场景，否则基线互相污染。③阈值触发上报时**带上页面 URL 与操作轨迹**——数值只能告诉你「涨了」，轨迹才能告诉你「在干什么时涨的」。
:::

## 二、启动性能：分段埋点 + 逐段消灭

不测量就优化是玄学。先把冷启动切成可观测的段：

```js
// 主进程：进程创建 → ready
const t0 = process.getCreationTime()      // 进程创建时刻（ms）
app.whenReady().then(() => {
  const readyAt = Date.now() - t0         // 段1：主进程启动

  const createStart = performance.now()
  const win = new BrowserWindow({})
  // 段2：窗口创建耗时（ready-to-show 时刻 - createStart）

  win.webContents.once('did-finish-load', () => {
    // 段3：页面加载
  })
})

// 渲染层首帧可交互时上报段4；业务数据就绪为段5
// 六段法：进程启动 → ready → 窗口创建 → 页面加载 → 首帧 → 可交互
```

::: exp 实战经验
①埋点 handler 设计成「一次性」：`ipcMain.handle('getAppLoadTime', ...)` 取一次即 `removeHandler`，渲染层读完即删全局函数——防止被反复调用导致重复上报。②首屏依赖远程配置（域名探测、配置拉取、更新检查）的应用，用 **Loading 小窗 + 主窗口延迟创建**：网络决策全部前置到启动壳里，主窗口就绪即开即用，用户感知的「白屏时间」直接消失。
:::

常见优化手段按收益排序：延迟加载非首屏模块（主进程 require 是同步阻塞）、预加载关键配置缓存（冷读缓存同步、拉新异步）、窗口 `show:false` + `ready-to-show` 再显示、V8 code cache（`v8-compile-cache` 类方案）。

## 三、流畅度与 GPU：合成层治理

掉帧问题的完整分析方法论见[案例库 · GPU 崩溃五步分析法](/guide/cases/02-gpu-crash)。本章讲治理工具箱：

```js
// 1. 验证法：怀疑 GPU 合成问题时，关硬件加速对照
app.disableHardwareAcceleration()   // 现象消失 = GPU 链路问题实锤

// 2. 让滚动动画不阻塞主线程（进合成层）
/* CSS: will-change: transform 或 transform: translateZ(0)
   长列表滚动卡顿 + 视频同屏时优先试这个 */

// 3. 长列表虚拟滚动（DOM 数量是渲染进程内存与 Layout 耗时的双重杀手）
```

::: exp 实战经验（没有官方 API 时的两个实战技巧）
**技巧一 · GPU 内存主动释放**：长挂机应用 GPU 进程内存只涨不跌，官方没有释放 API。实测有效的方法——制造一轮轻量合成任务把旧纹理「顶出去」：
```js
// 10x10 画布，把 1px 黑色 GIF 用 rAF 连画 15 帧
// 原理：驱动 LRU 淘汰不活跃纹理，实测可回收数百 MB
const c = document.createElement('canvas') /* 10x10 */
let i = 0
const draw = () => { c.getContext('2d').drawImage(blackGif, 0, 0); if (++i < 15) requestAnimationFrame(draw) }
requestAnimationFrame(draw)
```
**技巧二 · 强制重新合成**：`document.body.style.transform = 'scale(1)'` 触发整页重合成，旧合成层（常驻弹窗、轮播图累积出来的）被丢弃，idle 时恢复。配合 `webFrame.clearCache()` + 主进程 `webContents.clearCodeCache()` 是一组「页面级 GC」组合拳。
:::

### 后台运行的降载策略

默认 `backgroundThrottling` 会在窗口失焦时降计时器频率——但如果你**需要**后台持续运行（加速器、挂机工具），要关掉它换来自建精细控制：

```js
new BrowserWindow({
  webPreferences: { backgroundThrottling: false }  // 拿回控制权
})

// 失焦 500ms 后主动降载：停 GIF 动画、通知渲染层停非关键刷新
win.on('blur', () => setTimeout(() => {
  win.webContents.setImageAnimationPolicy('noAnimation')
  send(win, 'app:background', true)      // 渲染层自停动画/轮询
}, 500))
win.on('focus', () => send(win, 'app:background', false))
```

::: exp 实战经验
系统级内存回收的时机选择：窗口失焦是对进程工作集做修剪（trim working set）的最佳时机——用户主动切走了，正说明此刻不缺你。触发要节流（如 60s 一次），且任一窗口仍有焦点时跳过（游戏场景：用户全屏游戏中，好友列表窗口失焦回收自己，别动主程序）。Windows 上可用系统 API 对各子进程做 SetProcessWorkingSetSize 类修剪。
:::

## OOM 的最后一道防线：降配重建

低配机器上渲染进程 V8 堆分配失败是必现问题（默认堆上限约 4GB 的 32 位场景更早爆）。与其崩溃，不如降档重建：

```js
// 建窗口时预设堆上限
new BrowserWindow({
  webPreferences: { additionalArguments: ['--max-old-space-size=2048'] }
})

// 渲染进程 OOM 崩溃回调里（render-process-gone, reason 'oom'）：
// 用更小的堆（-512MB）重建窗口 → 销毁旧窗 → 上报
// 阶梯：2048 → 1536 → 1024，低于 1024 不再拦截（避免无限循环）
```

完整的崩溃恢复决策树见[监控章节](/guide/18-observability)。

## 延伸阅读

- [Performance 官方指南](https://www.electronjs.org/docs/latest/tutorial/performance)
- [app.getAppMetrics](https://www.electronjs.org/docs/latest/api/app) / [process-metric 结构](https://www.electronjs.org/docs/latest/api/structures/process-metric)
- [Chromium 内存.infra 文档](https://chromium.googlesource.com/chromium/src/+/main/docs/memory_infra.md) —— trace 内存快照的权威解读
- [Perfetto](https://ui.perfetto.dev/) —— trace 分析
- [memlab](https://facebook.github.io/memlab/)（Meta 开源）—— JS 堆泄漏自动化检测
