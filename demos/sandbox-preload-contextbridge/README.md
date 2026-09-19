# sandbox + preload + contextBridge · 完整安全基线示例

> 关联：[安全模型](/part2-core/10-security) · [IPC 通信](/part2-core/09-ipc) · 难度 ★★★

把现代 Electron 安全的**三层防线**做齐：进程沙箱（`sandbox: true`，渲染进程跑在 OS 级沙箱里）+ 上下文隔离（`contextIsolation: true`，preload 与页面是两个 JS 世界）+ contextBridge 白名单（页面只能调到这里显式声明的方法）。

**重要前提**：本演示默认所有 webPreferences 都不覆写（保持 Electron 20+ 的默认安全值），`sandbox: true` + `contextIsolation: true` + `nodeIntegration: false` 三个开关一个都不显式写——写出来就是 code smell。

## 文件清单

```text
sandbox-preload-contextbridge/
├── package.json          # 现代 Electron 版本（30+）
├── main.js               # 主进程：仅持有系统能力，不暴露 ipcMain 通道名
├── preload.js            # 桥接：白名单 + 参数校验 + 返回取消函数
├── index.html            # 渲染层：纯 DOM + 调用 window.api.*
├── renderer.js           # 渲染层业务：演示 invoke / 事件订阅 / 错误传播
└── README.md             # 本文件
```

## 完整代码

### package.json

```json
{
  "name": "electron-sandbox-preload-contextbridge",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "^31.0.0"
  }
}
```

### main.js —— 主进程只持有能力，不透传 ipcMain

```js
// 主进程：唯一允许 require 系统模块的地方
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')

// 配置键白名单——桥的「动词」之外的「名词」也必须登记
const ALLOWED_CONFIG_KEYS = new Set(['theme', 'locale', 'auto-launch'])

const createWindow = () => {
  const win = new BrowserWindow({
    width: 720,
    height: 520,
    title: '安全基线示例',
    // 注意：webPreferences 里一个安全开关都没写
    // ——靠 Electron 30+ 的默认值（sandbox + contextIsolation + nodeIntegration:false）
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
}

// 通道：读配置 —— 主进程侧做第二次校验
ipcMain.handle('config:get', async (_event, key) => {
  if (!ALLOWED_CONFIG_KEYS.has(key)) {
    throw new Error(`未注册的配置键：${key}`)
  }
  // 真生产代码应该从 app.getPath('userData') 下读；这里写死演示用
  return { key, value: process.env[`APP_${key.toUpperCase()}`] ?? null }
})

// 通道：选文件 —— 系统能力的标准封装
ipcMain.handle('dialog:openFile', async (_event, filters) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters ?? [{ name: '所有文件', extensions: ['*'] }]
  })
  return canceled ? null : filePaths[0]
})

// 通道：用系统默认应用打开外部链接 —— 防止页面拿 shell 任意执行
ipcMain.handle('shell:openExternal', async (_event, url) => {
  // URL 白名单校验：只允许 https，避免 javascript: / file: 注入
  if (typeof url !== 'string' || !/^https:\/\//.test(url)) {
    throw new Error('只允许打开 https 链接')
  }
  await shell.openExternal(url)
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

### preload.js —— 白名单桥 + 参数校验 + 取消订阅

```js
// preload：唯一能同时看到 ipcRenderer 和 contextBridge 的世界
const { contextBridge, ipcRenderer } = require('electron')

// 通道名只在 preload 里出现一次：渲染进程看不到字符串常量
const CONFIG_KEY_RE = /^(theme|locale|auto-launch)$/

contextBridge.exposeInMainWorld('api', {
  // 1) 语义化窄接口：动词白名单
  getConfig(key) {
    // 2) 桥这一侧先做一次浅校验，把明显非法的挡在 IPC 之外
    if (typeof key !== 'string' || !CONFIG_KEY_RE.test(key)) {
      return Promise.reject(new Error('非法的配置键'))
    }
    return ipcRenderer.invoke('config:get', key)
  },

  openFile(filters) {
    return ipcRenderer.invoke('dialog:openFile', filters)
  },

  openExternal(url) {
    return ipcRenderer.invoke('shell:openExternal', url)
  },

  // 3) 事件订阅返回「取消订阅」函数 —— 不暴露频道名
  onThemeChange(callback) {
    const listener = (_event, theme) => callback(theme)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  }
})
```

### index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>安全基线示例</title>
</head>
<body>
  <h1>三层防线示例</h1>

  <section>
    <h2>1. 配置读取（invoke / handle）</h2>
    <button id="btn-config">读取 theme</button>
    <button id="btn-config-bad">读取非法 key（应报错）</button>
    <pre id="out-config"></pre>
  </section>

  <section>
    <h2>2. 文件选择</h2>
    <button id="btn-file">选择文件</button>
    <pre id="out-file"></pre>
  </section>

  <section>
    <h2>3. 打开外部链接（白名单）</h2>
    <button id="btn-safe-url">打开 https://electronjs.org/</button>
    <button id="btn-bad-url">打开 javascript:alert(1)（应被拒）</button>
  </section>

  <section>
    <h2>4. 事件订阅（应返回取消函数）</h2>
    <button id="btn-subscribe">订阅主题变更</button>
    <button id="btn-unsubscribe">取消订阅</button>
    <pre id="out-event"></pre>
  </section>

  <script src="./renderer.js"></script>
</body>
</html>
```

### renderer.js —— 渲染层只能调 window.api.*

```js
// 渲染进程（sandbox + contextIsolation 都开）：这里既没有 require，也没有 ipcRenderer
// 能做的全部事情 = window.api 上挂的几个方法
const $ = (id) => document.getElementById(id)
const out = (id, msg) => { $(id).textContent = msg }

// 演示 1：invoke / handle + 错误传播
$('btn-config').addEventListener('click', async () => {
  try {
    const r = await window.api.getConfig('theme')
    out('out-config', JSON.stringify(r))
  } catch (e) {
    out('out-config', '【错误】' + e.message)
  }
})
$('btn-config-bad').addEventListener('click', async () => {
  try {
    const r = await window.api.getConfig('__proto__')
    out('out-config', JSON.stringify(r))
  } catch (e) {
    out('out-config', '【预期错误】' + e.message)
  }
})

// 演示 2：系统能力封装
$('btn-file').addEventListener('click', async () => {
  const path = await window.api.openFile([{ name: '图片', extensions: ['png', 'jpg'] }])
  out('out-file', path ?? '（取消）')
})

// 演示 3：白名单验证
$('btn-safe-url').addEventListener('click', () => window.api.openExternal('https://electronjs.org/'))
$('btn-bad-url').addEventListener('click', async () => {
  try {
    await window.api.openExternal('javascript:alert(1)')
  } catch (e) {
    alert('被白名单挡住：' + e.message)
  }
})

// 演示 4：事件订阅 + 取消
let unsubscribe = null
$('btn-subscribe').addEventListener('click', () => {
  unsubscribe = window.api.onThemeChange((t) => out('out-event', '主题变更为：' + t))
  out('out-event', '（已订阅）')
})
$('btn-unsubscribe').addEventListener('click', () => {
  unsubscribe?.()
  unsubscribe = null
  out('out-event', '（已取消订阅）')
})

// 自我验证：现代默认值下页面里没有 Node 能力
console.log('typeof require =', typeof require)        // 'undefined'
console.log('typeof process =', typeof process)        // 'undefined'
console.log('typeof window.api =', typeof window.api)  // 'object' —— 唯一通道
```

## 如何验证「防线真的在工作」

打开 DevTools 控制台，依次执行以下断言：

```js
// 1) 渲染进程被沙箱关住：没有 Node
typeof require           // 'undefined'
typeof process.versions   // 'undefined'

// 2) contextBridge 暴露的是 2 个独立的世界：拿不到 ipcRenderer
window.api.getConfig.toString()
// 应该是 'function getConfig() { [native code] }' —— 不是 JS 函数本体
// 你无法 hook 它、原型链污染对它无效

// 3) 桥参数校验生效：非法 key 直接 reject
await window.api.getConfig('__proto__')  // reject: '非法的配置键'

// 4) 外部链接白名单：javascript: 协议被主进程拒绝
await window.api.openExternal('javascript:alert(1)')  // reject
```

## 常见错误

| 错误 | 后果 |
|---|---|
| 在 webPreferences 里写 `sandbox: false` 理由是「preload 要 require 原生模块」 | 原生模块放主进程或 UtilityProcess，preload 只做 IPC 转发——这是正解，不是绕过 |
| 在 preload 里透传整个 `ipcRenderer`：`exposeInMainWorld('ipc', ipcRenderer)` | 等于把整个 IPC 通道表交给页面，等于没桥 |
| contextBridge 暴露一个会回传 DOM 节点的方法 | 节点过不了结构化克隆边界，调用就报错——这是设计而不是缺陷 |
| 监听事件忘了返回取消函数 | 每次订阅都在 ipcRenderer 里累积监听器，长时间运行后变成幽灵推送 |

## 跑起来

```bash
cd demos/sandbox-preload-contextbridge
pnpm install   # 或 npm install
pnpm start     # 等同于 electron .
```

打开 DevTools 看 console 里的三条断言，再点四个按钮看白名单与错误传播是否如预期工作。