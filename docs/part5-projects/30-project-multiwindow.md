# 项目二：多窗口多账号工作台——窗口协作的完整实战

> **一句话本质**：多窗口应用的全部难度不在「开窗口」，在「窗口之间的协作治理」——生命周期、通信、账号隔离、崩溃互不拖累；本项目用一个「多账号内容工作台」把这些治理问题全部趟一遍。

本项目与[项目一](/part5-projects/29-project-screenshot-recorder)互补：那边练「采集管线 + 托盘工具」，这边练「窗口体系 + 会话隔离」。

## 一、需求与形态

```text
产品：Workbench —— 多账号内容工作台（泛化的「多店铺运营台」形态）
M1  主窗口 + 左侧账号列表 + 右侧内容区（单账号）
M2  每个账号独立登录态（cookie/storage 隔离），同时在线 N 个
M3  账号间消息互通：一个账号收到通知，主窗口聚合展示
M4  浮动挂件窗（置顶小窗，显示当前账号未读数）
M5  防误关：有未处理事项时关主窗口需确认
```

## 二、架构选型：三条路的权衡（第 07 章结论的应用）

| 方案 | 优势 | 死穴 | 判决 |
|---|---|---|---|
| 每账号一个 BrowserWindow | 天然隔离 | N 个独立窗口，任务栏爆炸、内存最重 | ✗ |
| 单窗口 + WebContentsView 多账号 | [07 章](/part2-core/07-windows)三层结构：TabBar + ContentView + TipView | 需要自管可见性 | ✅（选中） |
| 单窗口单 webview 复用 | 最省 | 登录态无法隔离 | ✗ |

```mermaid
flowchart TB
    BW[BaseWindow 窗口壳] --> TAB[TabBarView 48px<br>账号标签页]
    BW --> CV[ContentView ×N<br>partition: persist:account-{id}]
    BW --> TIP[TipView 全屏覆盖<br>全局确认层]
```

## 三、迭代开发

### 迭代 1：壳与 TabBar（07 章骨架落地）

按 [07 章](/part2-core/07-windows)「BaseWindow + 三层 WebContentsView」搭建。TabBar 是本地渲染页（永远不切换），管理账号列表；ContentView 按需创建。

### 迭代 2：账号会话隔离（12 章 partition 的实战）

```js
// 每账号一个持久化分区
const view = new WebContentsView({
  webPreferences: {
    partition: `persist:account-${account.id}`,   // 12 章：cookie/storage 全隔离
    contextIsolation: true, sandbox: true,
  },
})
// 登录态复用：已保存的 token 写入该分区（12 章的安全写法：safeStorage 解密后注入）
await session.fromPartition(`persist:account-${account.id}`).cookies.set({
  url: 'https://work.example.com', name: 'auth', value: token, httpOnly: true,
})
```

**错峰启动**（生产客户端验证的细节）：

```js
// 恢复 N 个账号时不并发加载——第 i 个延迟 (i-1)×3s，带宽/内存峰值平滑
accounts.forEach((acc, i) => setTimeout(() => loadAccount(acc), i * 3000))
```

### 迭代 3：无闪烁切换 + 伪可见性（07 章两个隐藏知识点的应用）

```js
function switchTab(from, to) {
  win.contentView.addChildView(to.view)
  setTimeout(() => win.contentView.removeChildView(from.view), 100)  // 先加后删
  // WebContentsView 不触发 visibilitychange——手动通知两端
  send(from.view.webContents, 'tab:visible', false)
  send(to.view.webContents, 'tab:visible', true)
}
```

`tab:visible: false` 后账号页面应停轮询、降动画——这条「伪可见性协议」是三层结构的隐藏契约，漏掉就是后台账号空转烧电。

### 迭代 4：跨账号消息聚合（09 章通信模式的组合拳）

各账号页面的通知事件 → 各自 preload 上报 → 主进程聚合：

```js
// 每个 ContentView 的 preload 暴露同一接口
contextBridge.exposeInMainWorld('host', {
  notify: (msg) => ipcRenderer.send('wb:notify', msg),
  onUnread: (cb) => onIPC('wb:unread', cb),        // 09 章：返回取消函数的订阅
})
// 主进程：聚合 + 双路分发
ipcMain.on('wb:notify', (e, msg) => {
  const account = accountOf(e.sender)              // 09 章：fromWebContents 定位来源
  broadcast('wb:unread', { account, msg })         // TabBar 角标 + 主窗口聚合页
})
```

### 迭代 5：浮窗挂件（11 章托盘 + 07 章 window.open 流派）

挂件用 [07 章](/part2-core/07-windows)的 `window.open` 命名子窗流派：无焦点、置顶、跳任务栏：

```js
win.webContents.setWindowOpenHandler(({ url }) => {
  if (url.startsWith('widget://')) {
    return { action: 'allow',
      overrideBrowserWindowOptions: { frame: false, alwaysOnTop: true, skipTaskbar: true, focusable: false, width: 240, height: 96 } }
  }
  return { action: 'deny' }                        // 10 章：其余一律拒
})
```

::: pitfall 坑位警报
无焦点置顶小窗是 Chromium 边缘行为重灾区（来自真实客户端的 workaround 集）：①挂件最小化会扰乱主窗焦点——挂件永远不 minimize，只 hide；②主窗最小化后挂件需要二次 `setAlwaysOnTop(true)` 重新生效（120ms 后重试一次的节奏）；③挂件隐藏前先把内容 `display:none` 再 hide，避免渲染降级残留。
:::

### 迭代 6：防误关与收尾

```js
win.on('close', (e) => {
  const unread = totalUnread()
  if (unread > 0 && !forceQuit) {
    e.preventDefault()
    showTipView({ text: `还有 ${unread} 条未读，确认退出？`, onOk: () => { forceQuit = true; win.close() } })
  }
})
app.on('before-quit', () => { forceQuit = true })   // 05 章：退出链要与手动关区分
```

## 四、性能与稳定基线（18/23 章的最小落地）

- **内存观测**：`app.getAppMetrics()` 5 分钟轮询（18 章三支柱的最小版），每账号 ContentView 打标归属，多账号内存一眼可拆
- **渲染崩溃隔离**：单账号 `render-process-gone` 只重建该 view 不动壳（23 章决策树裁剪版）
- **启动埋点**：六段启动耗时（18 章）验证错峰策略有效

## 五、复盘对照表

| 本项目遇到的 | 全书对应知识 |
|---|---|
| 账号 cookie 互串 | [12 章](/part2-core/12-storage) partition |
| 切 tab 白一帧 | [07 章](/part2-core/07-windows) 先加后删 |
| 后台账号费电 | 伪可见性协议（07） |
| 挂件置顶失效 | [07 章](/part2-core/07-windows) workaround 集 |
| 关窗丢未读确认 | [05 章](/part1-background/05-lifecycle) 退出链 |
| 多账号内存归因 | [18 章](/part3-engineering/18-performance) getAppMetrics 打标 |

## 延伸阅读

- [07 章窗口体系](/part2-core/07-windows) / [12 章存储](/part2-core/12-storage) / [09 章 IPC](/part2-core/09-ipc) —— 本项目三大支柱
- [BaseWindow](https://www.electronjs.org/docs/latest/api/base-window) / [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view) 官方 API
- [用例 05 窗口状态](/examples/)、[用例 11 单实例](/examples/) 可直接复用
