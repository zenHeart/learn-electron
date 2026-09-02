# 07 · 系统通知

> 关联章节：[11 · 系统能力](/part2-core/11-system) · 难度 ★★

从主进程发一条系统通知，三行代码的事——但 Windows 上「通知不弹 / 显示成 Electron.exe」的坑能吞掉新手一下午。这个用例把坑直接写进代码注释里。

**知识点**

- 主进程 `Notification` 类：跨平台一致的推荐姿势
- **Windows 坑**：`app.setAppUserModelId` 不设置，通知可能不弹或身份错乱
- `Notification.isSupported()`：先探测再发
- `click` 事件：点通知把窗口拉回前台（通知是入口，不只是提示）

## 代码

**package.json**

```json
{
  "name": "electron-07-notification",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('node:path')

// Windows 坑位：AppUserModelID 决定通知的归属。
// 开发阶段用 process.execPath 就能工作；
// 打包后必须换成安装时写死的稳定 ID（如 com.yourteam.yourapp）
if (process.platform === 'win32') {
  app.setAppUserModelId(process.execPath)
}

let win = null

ipcMain.handle('notify', (_e, { title, body }) => {
  if (!Notification.isSupported()) {
    return { ok: false, error: '当前系统不支持通知' }
  }
  const n = new Notification({
    title: title || '团队小工具',
    body: body || '来自主进程的问候'
  })
  // 点通知 = 用户想回到应用：拉起并聚焦窗口
  n.on('click', () => {
    if (win) { win.show(); win.focus() }
  })
  n.show()
  return { ok: true }
})

const createWindow = () => {
  win = new BrowserWindow({
    width: 480,
    height: 320,
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
  notify: (payload) => ipcRenderer.invoke('notify', payload)
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>notification</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>发一条通知</h1>
  <input id="body" placeholder="通知内容（留空用默认）" style="padding: 8px; width: 60%" />
  <button id="send">发送</button>
  <p id="result"></p>
  <script>
    document.getElementById('send').addEventListener('click', async () => {
      const r = await window.electronAPI.notify({
        title: '团队小工具',
        body: document.getElementById('body').value
      })
      document.getElementById('result').textContent =
        r.ok ? '已发送——注意看系统通知中心，点它可以回到窗口' : r.error
    })
  </script>
</body>
</html>
```

## 动手改造

1. Windows 用户：注释掉 `app.setAppUserModelId` 那段，对比通知的显示身份与点击行为（不同 Windows 版本表现不同，这正是坑的烦人之处）。
2. 加 `silent: true` 发一条静默通知（不响铃，只进通知中心）。
3. 在页面 `<script>` 里直接写 `new Notification('页面发的')` 试试 Web 版通知——观察它在 `file://` 页面下的表现，体会「能主进程做就主进程做」的省心。
