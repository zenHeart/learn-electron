# 09 · 给自己窗口截图

> 关联章节：[08 · 截屏与屏幕捕获](/part2-core/08-screenshot) · 难度 ★★

「给当前窗口拍张照存成 PNG」——`webContents.capturePage()` 一行调用，是三条截屏路径中最简单的一条（另外两条：跨进程截别的窗口、全屏采集，见 08 章）。

**知识点**

- `webContents.capturePage()`：截的是**页面内容区**——不含系统鼠标、不含其他窗口、不含 dock 在窗口里的 DevTools
- `NativeImage.toPNG()`：截图结果是 NativeImage 对象，`toPNG()` 转 Buffer 直接落盘
- 数据从主进程回传渲染层：Buffer 走结构化克隆，零拷贝成本（这里我们直接在主进程写盘，只回传路径——更省）

## 代码

**package.json**

```json
{
  "name": "electron-09-capture-page",
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

ipcMain.handle('capture:self', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  // 截页面内容区。若页面尚未完成首次绘制，结果可能是空图——
  // 正式项目建议在页面 load 完成后再允许触发
  const image = await win.webContents.capturePage()
  const file = path.join(app.getPath('desktop'), `capture-${Date.now()}.png`)
  fs.writeFileSync(file, image.toPNG())
  return file
})

const createWindow = () => {
  const win = new BrowserWindow({
    width: 560,
    height: 400,
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
  captureSelf: () => ipcRenderer.invoke('capture:self')
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>capture</title>
</head>
<body style="font-family: sans-serif; padding: 24px; background: #1e1e1e; color: #eee">
  <h1>给自己拍张照</h1>
  <p style="color: #aaa">截图存到桌面，深色背景让边界一目了然。</p>
  <input placeholder="在这里随便输入点什么再截图" style="padding: 8px; width: 60%" />
  <br /><br />
  <button id="shot" style="padding: 8px 24px">截图</button>
  <p id="result" style="color: #8fd"></p>
  <script>
    document.getElementById('shot').addEventListener('click', async () => {
      const file = await window.electronAPI.captureSelf()
      document.getElementById('result').textContent = `已保存：${file}`
    })
  </script>
</body>
</html>
```

## 动手改造

1. 把 `toPNG()` 换成 `toJPEG(80)`（文件名也改 `.jpg`），对比同一画面的文件体积。
2. 点截图后先改页面再截：把按钮回调改成先 `document.body.style.background = '#333'` 再 `await` 截图——观察截图时机与渲染时序的关系。
3. 进阶：换 `desktopCapturer.getSources()` 实现全屏截图（08 章「路径二」，需要 `preload` 里额外桥接——那是权限与句柄的另一个世界）。
