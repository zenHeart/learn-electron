# 04 · 右键菜单

> 关联章节：[11 · 系统能力](/part2-core/11-system) · 难度 ★★

网页自己做右键菜单是「画」出来的；Electron 应用右键弹出的是**原生菜单**——由主进程的 `Menu` 构造，经 IPC 触发。这个用例还包含一次回程消息：点菜单项反过来改页面。

**知识点**

- `contextmenu` 事件 → IPC → `Menu.popup()`：原生右键菜单的标准链路
- `role` 项（cut/copy/paste）：系统自带行为，免费拿
- `webContents.send`：主进程主动推消息给页面（IPC 三模式之二）
- `inspectElement(x, y)`：给应用留一个「检查元素」入口

## 代码

**package.json**

```json
{
  "name": "electron-04-context-menu",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('node:path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 520,
    height: 380,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  })
  win.loadFile('index.html')
}

// 页面右键 → 发来坐标 → 主进程造菜单并弹出
ipcMain.on('context-menu', (event, x, y) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  Menu.buildFromTemplate([
    { role: 'cut', label: '剪切' },
    { role: 'copy', label: '复制' },
    { role: 'paste', label: '粘贴' },
    { type: 'separator' },
    {
      label: '清空输入框',
      click: () => win.webContents.send('ctx:clear-input')  // 回程：主进程 → 页面
    },
    { label: '检查元素', click: () => win.webContents.inspectElement(x, y) }
  ]).popup({ window: win })
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

**preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  showContextMenu: (x, y) => ipcRenderer.send('context-menu', x, y),  // 去
  onClearInput: (callback) => ipcRenderer.on('ctx:clear-input', callback)  // 回
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>context-menu</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>右键试试</h1>
  <input id="input" placeholder="在这里右键 / 输入点文字再右键" style="width: 100%; padding: 8px" />
  <script>
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault()  // 拦掉浏览器默认菜单
      // 传页面坐标，主进程「检查元素」要用
      window.electronAPI.showContextMenu(e.clientX, e.clientY)
    })
    window.electronAPI.onClearInput(() => {
      document.getElementById('input').value = ''
    })
  </script>
</body>
</html>
```

## 动手改造

1. 给菜单加一个二级菜单（`submenu`），比如「插入」→ 「时间戳」「随机数」。
2. 把 `清空输入框` 的实现改成直接在主进程操作页面（提示：没有好办法——这正是「回程消息」存在的理由，试着体会）。
3. 只有右键输入框时才弹菜单（提示：在 `contextmenu` 监听里判断 `e.target`）。
