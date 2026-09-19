# electron-security-baseline · 安全基线探针

## 1) Explain · 闭卷 3 题

**Q1**：解释「三层防线」——OS 级沙箱、contextIsolation、contextBridge——各自的攻击者模型是什么？哪一层防哪类攻击？

**Q2**：`webPreferences: { nodeIntegration: true, contextIsolation: false }` 出现在你的项目里，你作为接手者要做的第一件事是什么？为什么？

**Q3**：preload 里 `contextBridge.exposeInMainWorld('api', ipcRenderer)` 是常见反模式。攻击者拿到这个 `api` 后能做到什么？给出具体的攻击链。

### 通过标准

- Q1：OS 沙箱防「逃出 Chromium 隔离」、contextIsolation 防「同进程世界污染」、contextBridge 防「白名单滥用」——逐层缩小攻击面
- Q2：第一件事是问「这段历史配置是为了解决什么问题」；不要直接删除，找到原因再改
- Q3：能列具体攻击链：通过任意 invoke 通道名 + 任意 payload，包括 `webContents.executeJavaScript` 等主进程 API（如果通道表里注册过）

## 2) Perform · 新起点最小任务

**任务**：从空目录搭一个最小可运行的安全基线应用：
- 一个窗口、两个按钮：选图片文件、把选中路径在窗口里显示
- preload 只暴露 `pickImage()` 一个方法（不接受任何参数）
- 通道名只在 preload 里以字符串字面量出现
- 主进程侧对收到的路径做白名单校验（必须以 `~/Pictures/` 开头）
- 监听 `theme:changed` 事件，返回取消订阅函数
- 不显式写 `nodeIntegration` / `contextIsolation` / `sandbox`——靠默认值

### 通过标准

- 现代 Electron 版本（30+）
- 所有安全开关走默认值
- 桥参数白名单生效（构造一个非法路径，应被拒）

## 3) Debug · 陌生故障定位

```js
// 接手历史项目，main.js 里有这段：
const win = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: true,       // 已知问题，遗留
    contextIsolation: false,     // 已知问题，遗留
    webSecurity: false           // 已知问题，遗留
  }
})
```

**用户问题**：白屏时报错 `Uncaught TypeError: window.api is not a function`。

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron')
window.electronAPI = {
  loadConfig: () => ipcRenderer.invoke('config:get')
}
// 用户错误：他们去 window.api.loadConfig()，但 preload 暴露的是 window.electronAPI
```

请：
1. 给出最短修复（不改主进程 / preload，只改 renderer 的调用）
2. 解释为什么这种修法不算「真修复」——根本问题是什么？
3. 给出「真修复」的两步方案（含每步验收标准）

### 通过标准

- 短修：把 `window.api` 改成 `window.electronAPI`
- 解释：白屏是因为 API 名拼错，但 `nodeIntegration: true` + `contextIsolation: false` 是真正的根因——任何 preload 错误现在都会暴露给页面
- 真修复：
  1. 三开关全部靠默认值（删除显式覆写）
  2. preload 用 `contextBridge.exposeInMainWorld` 而不是直接挂 `window.*`
  3. 验收：DevTools 里 `typeof require === 'undefined'`、桥 API 通过 `window.api` 访问

## 4) Transfer · 同机制换约束

**场景**：把同样的安全基线从本地文件加载 (`loadFile`) 切换到远程 URL 加载 (`loadURL('https://app.example.com')`)。

需要补充哪些安全措施？列出 3 条 + 各自的最小配置。

### 通过标准

- CSP：响应头设 `Content-Security-Policy` 收紧 `script-src`（拒绝 inline + eval）
- `setWindowOpenHandler` 拦截 `window.open`，统一改用 `shell.openExternal` 并白名单
- `webRequest.onBeforeRequest` / `session.webRequest` 拦截所有非白名单域名的请求