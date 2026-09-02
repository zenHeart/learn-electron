# 10 · Deep Link 协议

> 关联章节：[11 · 系统能力](/part2-core/11-system) · 难度 ★★★

让浏览器里的 `learn-electron://hello` 唤起你的应用——下载器「点链接加速」、网盘「客户端打开」都是这个机制。两平台的实现路径完全不同，而且**开发期与打包后的表现也不同**，这些差异本身就是本用例的知识点。

**知识点**

- `app.setAsDefaultProtocolClient`：注册自定义协议（Windows 写注册表，macOS 依赖 Info.plist）
- macOS 走 `open-url` 事件；Windows 靠「第二实例带参数」——所以 Deep Link 在 Windows 上必须配合单实例锁
- **开发期限制**：macOS 的 `open-url` 只有打包应用（Info.plist 声明 `CFBundleURLTypes`）才能收到；Windows 开发期即可工作（注册表指向 electron.exe）

## 代码

**package.json**

```json
{
  "name": "electron-10-open-url",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const PROTOCOL = 'learn-electron'
let win = null

// 注册协议。Windows：写注册表（开发期指向 electron.exe + 本应用路径，可工作）
// macOS：开发期注册不完整，须打包后在 Info.plist 声明 CFBundleURLTypes
app.setAsDefaultProtocolClient(PROTOCOL)

const handleLink = (url) => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  win.webContents.send('open-url', url)  // 把 URL 交给页面展示
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // Windows：协议唤起会启动新进程，拿不到锁的它只是「送参数的信使」
  app.quit()
} else {
  app.on('second-instance', (_e, argv) => {
    const url = argv.find((a) => a.startsWith(`${PROTOCOL}://`))
    if (url) handleLink(url)
  })

  app.on('open-url', (e, url) => {
    // macOS 专属：系统把 URL 交给已运行的应用（无需自己抢锁）
    e.preventDefault()
    handleLink(url)
  })

  app.whenReady().then(() => {
    win = new BrowserWindow({
      width: 560,
      height: 380,
      webPreferences: { preload: path.join(__dirname, 'preload.js') }
    })
    win.loadFile('index.html')
    // Windows 首次启动也可能带 URL 参数（应用未运行时点链接）
    const url = process.argv.find((a) => a.startsWith(`${PROTOCOL}://`))
    if (url) {
      win.webContents.once('did-finish-load', () => handleLink(url))
    }
  })
}
```

**preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onOpenUrl: (callback) => ipcRenderer.on('open-url', (_e, url) => callback(url))
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>open-url</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>Deep Link 接收台</h1>
  <p>测试命令（在系统终端里执行，不是这里）：</p>
  <p><code>open "learn-electron://hello/42"</code>（macOS）</p>
  <p><code>start "" "learn-electron://hello/42"</code>（Windows cmd）</p>
  <p>收到的 URL：<b id="url" style="color: #09c">（还没有）</b></p>
  <script>
    window.electronAPI.onOpenUrl((url) => {
      document.getElementById('url').textContent = url
    })
  </script>
</body>
</html>
```

## 动手改造

1. 解析 URL 参数：用 `new URL(url)` 取出 `host` 与 `search`，实现 `learn-electron://note/42` → 页面显示「打开笔记 42」。
2. 结合[11 号用例](/examples/11-single-instance/)：在 `second-instance` 里同时处理 deep link 与普通命令行参数。
3. 打包验证（进阶）：用 electron-builder 打包后再测 macOS 的 `open-url`——开发期收不到而打包后能收到，是本用例最重要的认知差。
