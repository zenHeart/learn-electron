# 03 · preload 与第一次 IPC

> 关联章节：[06 · 新人第一课](/part2-core/06-first-app) / [09 · IPC 通信](/part2-core/09-ipc) · 难度 ★★

页面里的按钮，调起操作系统的文件选择对话框——Electron 的核心机制 `invoke / handle` + `contextBridge`，三文件完整版。多选文件后结果以列表展示。

**知识点**

- `ipcMain.handle` / `ipcRenderer.invoke`：请求-响应模式（90% 场景的默认选择）
- `contextBridge.exposeInMainWorld`：白名单桥，页面唯一合法的能力入口
- 返回值如何跨进程往返（结构化克隆，路径字符串直接可传）

## 代码

**package.json**

```json
{
  "name": "electron-03-preload-ipc",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 520,
    height: 420,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
}

// 处理端：渲染进程每 invoke 一次 'dialog:chooseFiles'，这里执行一次
ipcMain.handle('dialog:chooseFiles', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '选择图片（可多选）',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  })
  // 这个返回值会变成渲染进程 await 的结果
  return canceled ? [] : filePaths
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

**preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron')

// 白名单桥：页面只能调到这里显式声明过的接口，摸不到 ipcRenderer 本体
contextBridge.exposeInMainWorld('electronAPI', {
  chooseFiles: () => ipcRenderer.invoke('dialog:chooseFiles')
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>preload-ipc</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>选择文件</h1>
  <button id="pick">选择图片（可多选）</button>
  <ul id="list"></ul>
  <script>
    document.getElementById('pick').addEventListener('click', async () => {
      const files = await window.electronAPI.chooseFiles()
      const list = document.getElementById('list')
      list.innerHTML = ''
      for (const f of files) {
        const li = document.createElement('li')
        li.textContent = f
        list.appendChild(li)
      }
    })
  </script>
</body>
</html>
```

## 动手改造

1. 在 `ipcMain.handle` 回调里加一行 `console.log('有人调我了')`，跑起来点按钮——去终端（不是 DevTools）看日志，体会两个日志世界。
2. 把 `dialog.showOpenDialog` 换成 `dialog.showSaveDialog`，做一个「另存为」按钮。
3. 新增一个通道 `app:getVersions`，主进程返回 `process.versions`（含 electron / chrome / node 版本），页面显示出来——这是排查环境问题时的标准动作。
