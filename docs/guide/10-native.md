# 原生能力扩展

> **一句话本质**：Electron 应用接原生代码，本质是接一个「编译产物 + ABI 契约」——`.node` 文件必须和你这版 Electron 的 ABI 对齐，而「SDK 放在哪个进程」是比「怎么调」更重要的架构决策。

读完本章你会获得：原生模块的两种集成路线（自编译 vs 预编译分发）与 ABI 对齐原理、SDK 进程放置的决策框架、同构 SDK 的传输层注入模式（一套业务代码跑 Electron 和浏览器）、以及跨端桥接的能力位契约设计。

## 心智模型：三个正交决策

```text
决策一：产物怎么来        决策二：放在哪个进程        决策三：怎么跨端
─────────────────        ─────────────────        ─────────────────
node-gyp 源码编译          主进程（中心化）            传输层注入
        or                  渲染侧 preload             （IPC 实现/Web 实现互换）
prebuild 预编译下载         UtilityProcess
                          （隔离/不阻塞主进程）
```

## 一、原生模块：ABI 是第一约束

### 什么是 `.node` 文件

原生模块就是一份动态库（Windows 上是 DLL 形态的 `.node`），暴露符合 Node C-API（N-API）规范的注册入口。`require('xxx.node')` 时 Node 运行时加载它并把导出包装成 JS 对象。

**ABI（应用二进制接口）**：模块编译时针对的 Node/V8 版本结构。Electron 内置的 Node 与官方 Node 版本不同——**给官方 Node 编译的 `.node` 在 Electron 里直接加载会崩**。

### 路线一：源码编译（electron-rebuild）

```bash
# 装好原生依赖后，针对当前 Electron 重编
npx @electron/rebuild
# 或在 package.json 配置 postinstall 自动化
```

适用：社区模块（better-sqlite3、sharp 等）——它们发布时带了各平台源码或预编译产物，rebuild 保证 ABI 对齐。

### 路线二：预编译分发（团队级 SDK 的现实形态）

自研 C++/Rust SDK 的团队通常**不走 node-gyp**，而是：

```text
独立 SDK 仓库（C++/Rust 工程）
  → CI 产出 .node + 一族配套 DLL/资源文件
  → 客户端仓库把它们当二进制资源：
     electron-builder 配 extraResources 拷到 resources/addon/
  → 运行时用绝对路径 require：
     require(path.join(process.resourcesPath, 'addon', 'xxx_sdk.node'))
```

```yaml
# electron-builder.yml
extraResources:
  - from: lib/xxx-sdk
    to: addon/xxx-sdk
    filter: ['**/*']        # .node + 全部 DLL 都要带上，缺一个就是运行时 126 错误
```

::: pitfall 坑位警报
路线二的隐藏代价：**Electron 大版本升级 = 原生 SDK 重新验证**。ABI 变化可能让旧 `.node` 静默出错而非明确报错。生产项目的做法是把「Electron 版本」与「SDK 版本」锁死联动，升级清单里原生验证是必过项（见[版本策略附录](/appendix/versioning)）。另外 `process.cwd()` 在打包后是系统根目录——永远用 `process.resourcesPath` 或 `__dirname` 定位资源。
:::

官方指南：[Using Native Node Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)、[Native Code & Electron](https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron)。

## 二、SDK 放哪个进程：数据形态决定放置

这是原生集成最重要的架构决策，比任何代码细节影响都大：

| SDK 数据形态 | 放置 | 理由 | 例子 |
|---|---|---|---|
| JSON 可序列化 | **主进程** | 中心化管理（登录态/生命周期单点）、所有窗口共享、掉线重连好做 | IM 消息、配置同步 |
| 不可序列化（句柄/帧数据/设备） | **渲染侧 preload** | 过 IPC 会把每帧数据序列化，性能不可接受 | RTC 视频流、屏幕采集 |
| CPU 密集且独立 | **UtilityProcess** | 不阻塞主进程、崩溃隔离 | 文件解压、编解码 |

::: exp 实战经验
「消息类放主进程 + 媒体类放渲染侧」的双轨放置在大型客户端被反复验证。放主进程的 SDK 用一个通用桥（见下节），放渲染侧的代价是安全配置——preload 直接实例化 SDK 意味着那个窗口无法开 contextIsolation 的完整隔离，这是一个要显式承认并用其他手段（导航白名单、CSP、进程内最小暴露面）补偿的取舍，而不是假装没有损失。
:::

### 主进程 SDK 的通用桥模式

SDK 方法多（几十个）时，逐个建 IPC 通道会失控。生产验证的模式是**单通道 + 反射路由 + 回调注册表 + 节流批量**：

```js
// 主进程：所有 SDK 调用走一个 handle 通道
const sdk = require('.../im_sdk.node')
const callbacks = new Map()   // 回调注册表：渲染层只传 key，主进程持引用

ipcMain.handle('sdk:invoke', (_e, payloadJson) => {
  const { method, manager, param, callbackKey } = JSON.parse(payloadJson)
  // 按 manager + method 反射路由到 SDK 实例的方法
  return sdk[manager][method](param)
})

// SDK → 渲染层的高频回调：150ms 节流批量下发（完整实现见 IPC 章节）
sdk.onMessage = throttledSender(win, 'sdk:im-message', 150)
```

## 三、同构 SDK：一套业务代码跑双端

产品同时有 Web 版和桌面版时，业务层不该 `if (isElectron)` 满天飞。生产模式是**传输层注入**：

```ts
// SDK 类把底层传输定义为「静态注入点」
class ChatSDK {
  // 默认未注入时直接抛错，逼着启动时配置
  static invoke: (method: string, param: unknown) => Promise<unknown> = () => {
    throw new Error('transport not injected')
  }
  static listen: (event: string, cb: Function) => void = () => {
    throw new Error('transport not injected')
  }
}

// Electron 端（preload 里注入 IPC 实现）
ChatSDK.invoke = (m, p) => ipcRenderer.invoke('sdk:invoke', { method: m, param: p })
ChatSDK.listen  = (e, cb) => ipcRenderer.on(`sdk:${e}`, cb)

// Web 端（注入 WebSocket 实现）
ChatSDK.invoke = (m, p) => wsRequest(m, p)
ChatSDK.listen  = (e, cb) => wsBus.on(e, cb)

// 业务层：只面向 ChatSDK 接口编程，零平台判断
await ChatSDK.sendMessage(roomId, text)
```

这是「渲染层热更新」（见[更新章节](/guide/13-updates)）可行的前提——渲染层产物不含任何原生依赖，才能被独立替换。

## 四、跨端契约：能力位（capability）协商

壳（Electron 主程序）与壳内 Web 代码**分仓发布、版本不对齐**时（壳 3.2 可能跑着 Web 5.7 的代码），版本号比较是死路。生产验证的方案是**能力位探测**：

```js
// preload 注入的桥对象，除了方法还声明「我支持什么」
contextBridge.exposeInMainWorld('hostBridge', {
  // ...具体方法...
  capability: {
    multiTab: true,        // 支持多标签
    floatWindow: true,     // 支持悬浮窗
    screenshot: false      // 不支持截屏（老壳）
  }
})

// Web 侧：用之前逐项探测，不支持就降级
if (window.hostBridge?.capability.screenshot) {
  await window.hostBridge.screenshot()
} else {
  showFallbackPreview()   // 降级路径：弹框替代
}
```

```js
// 壳内前端还可能跑在纯浏览器（无壳）——探测要带可选链
const inHost = !!window.hostBridge
```

::: exp 实战经验
能力位契约是「客户端即运行时」思维的核心：Web 代码永远问「你现在能给我什么」，而不是「你是什么版本」。配套纪律：壳移除任何能力前，能力位先置 false 观察一个发布周期（给 Web 侧留降级时间），然后再删方法。反向地，对调用失败的埋点上报（哪个能力在哪个版本上被调失败了）是壳与 Web 团队之间最有价值的对账数据。
:::

::: pitfall 坑位警报
一个常见安全反例：为图省事做「反射式万能通道」——渲染层传方法名字符串，主进程 `win[method](...args)` 直接调用。这等于把整个 BrowserWindow API 面暴露给不可信的渲染层（XSS 后可 `win.destroy()` / `webContents.executeJavaScript()` 任意操作）。正确做法：显式方法白名单 + 参数校验，宁可多样板。
:::

## 五、Chrome 扩展与轻量扩展点

- Chrome 扩展加载：`session.loadExtension`（仅支持部分 API，Electron 的扩展支持是有限的，生产依赖需先验证）——[Extensions 支持](https://www.electronjs.org/docs/latest/api/extensions)
- 命令行开关注入运行时行为（feature flag / GPU 规则）：见[命令行速查](/appendix/cli-reference)与[性能章节](/guide/16-performance)

## 延伸阅读

- [Using Native Node Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) —— electron-rebuild 与 ABI
- [Native Code & Electron](https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron) —— 各平台原生开发指引
- [UtilityProcess API](https://www.electronjs.org/docs/latest/api/utility-process)
- [Node-API 文档](https://nodejs.org/api/n-api.html) —— ABI 稳定层的官方说明
- [contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge) —— 能力位契约的载体
