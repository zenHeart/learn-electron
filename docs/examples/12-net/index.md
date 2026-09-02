# 12 · 主进程网络请求

> 关联章节：[09 · IPC 通信](/part2-core/09-ipc) · 难度 ★★

页面里的 `fetch` 受 CORS 管着；主进程的 `net` 模块没有这层顾虑。这个用例从主进程请求一个公开 API，把结果经 IPC 送回页面——「渲染层做界面，主进程做一切需要特权的事」的标准组合拳。

**知识点**

- `net.fetch`（Electron 28+）：主进程里发请求的现时代姿势，走 Chromium 网络栈（自动系统代理、共享会话 Cookie）
- 为什么请求放主进程：无 CORS、能拿到系统代理配置、可检测离线（`net.isOnline()`）
- 错误跨 IPC 传播：`handle` 里 `throw`，渲染进程的 `await` 就地 `reject`——错误处理不用自己造轮子
- `AbortSignal.timeout`：给请求一个确定的上限

## 代码

**package.json**

```json
{
  "name": "electron-12-net",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, ipcMain, net } = require('electron')
const path = require('node:path')

ipcMain.handle('net:getIp', async () => {
  if (!net.isOnline()) {
    throw new Error('当前离线，发什么请求')
  }
  // 主进程 fetch：没有 CORS，走系统代理
  const res = await net.fetch('https://api.ipify.org?format=json', {
    signal: AbortSignal.timeout(5000)   // 5 秒必须给个交代
  })
  if (!res.ok) {
    // 这里 throw 出去的 Error.message 会跨 IPC 传回渲染进程
    throw new Error(`服务端返回 HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.ip
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 520,
    height: 340,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

**preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getIp: () => ipcRenderer.invoke('net:getIp')
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>net</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>我的公网 IP 是</h1>
  <p id="ip" style="font-size: 28px; color: #09c">（点下面按钮）</p>
  <button id="go">请求主进程</button>
  <p id="err" style="color: #c33"></p>
  <script>
    document.getElementById('go').addEventListener('click', async () => {
      document.getElementById('err').textContent = ''
      try {
        const ip = await window.electronAPI.getIp()
        document.getElementById('ip').textContent = ip
      } catch (err) {
        // 主进程 handle 里 throw 的错误，在这里被接住
        document.getElementById('err').textContent = `出错了：${err.message}`
      }
    })
  </script>
</body>
</html>
```

## 动手改造

1. 把超时从 5000 改成 1 毫秒，点按钮——看 `AbortSignal.timeout` 的错误如何一路从主进程传到页面的红字里。
2. 换成你自己关心的 API（内部接口、天气接口都行），体会「不用再求后端开 CORS 头」的自由。
3. 对比实验：在页面 `<script>` 里直接 `fetch('https://api.ipify.org?format=json')`——这个 API 带 CORS 头所以能成；再找一个**不带** CORS 头的接口试一次，你就明白为什么这条用例把请求放在主进程。
