# 08 · 用户数据读写

> 关联章节：[12 · 存储架构](/part2-core/12-storage) · 难度 ★★★

桌面应用的第一条数据守则：**永远不要写进安装目录**（可能只读、可能被系统清理），唯一保证可写的是 `app.getPath('userData')`。这个用例做一个「关机不丢」的自动保存笔记，并演示原子写。

**知识点**

- `userData`：三个平台各自的应用数据目录（mac `~/Library/Application Support`、Win `%APPDATA%`、Linux `~/.config`）
- 原子写（tmp + rename）：进程写到一半被杀，文件要么是旧的、要么是新的，**永远不会是半个**
- JSON 作为跨进程数据格式：读进来再改，改完整体写回

## 代码

**package.json**

```json
{
  "name": "electron-08-file-io",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const dataFile = path.join(app.getPath('userData'), 'note.json')

ipcMain.handle('note:load', () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  } catch {
    return null   // 文件不存在 / 损坏，都当作没有笔记
  }
})

ipcMain.handle('note:save', (_e, text) => {
  // 原子写：先写临时文件，再 rename 顶替正式文件。
  // rename 在同一分卷上是原子操作——写一半断电，丢的只是 tmp
  const tmp = `${dataFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify({ text, savedAt: Date.now() }, null, 2))
  fs.renameSync(tmp, dataFile)
  return dataFile   // 把存到了哪里返回给页面展示
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 520,
    height: 420,
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
  loadNote: () => ipcRenderer.invoke('note:load'),
  saveNote: (text) => ipcRenderer.invoke('note:save', text)
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>file-io</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>不怕关机的笔记</h1>
  <textarea id="note" rows="8" style="width: 100%; padding: 8px" placeholder="写点什么，然后关掉应用试试"></textarea>
  <button id="save">保存</button>
  <p id="status" style="color: #666"></p>
  <script>
    // 打开时读回上次的内容
    window.electronAPI.loadNote().then((note) => {
      if (note) {
        document.getElementById('note').value = note.text
        document.getElementById('status').textContent =
          `上次保存于 ${new Date(note.savedAt).toLocaleString()}`
      }
    })
    document.getElementById('save').addEventListener('click', async () => {
      const where = await window.electronAPI.saveNote(document.getElementById('note').value)
      document.getElementById('status').textContent = `已保存到：${where}`
    })
  </script>
</body>
</html>
```

## 动手改造

1. 把单条笔记改成 `notes` 数组：页面加「新建笔记」，侧边栏列出全部标题（数据结构升级：`{ notes: [{ id, text, savedAt }] }`）。
2. 把 `renameSync` 那两行换成一次 `fs.writeFileSync(dataFile, ...)` 直接写，写大文本时强制杀进程（活动监视器里杀），多试几次看能不能截到半截文件——截不到是运气，截到了才懂原子写。
3. 用[03 号用例](/examples/03-preload-ipc/)的对话框加一个「导出到任意位置」功能。
