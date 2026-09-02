# 01 · 最小窗口

> 关联章节：[06 · 新人第一课](/part2-core/06-first-app) · 难度 ★

一个窗口、一行标题、三件套——Electron 世界的「Hello World」。所有用例的起点：先让东西跑起来，再谈别的。

**知识点**

- `package.json` 的 `main` 字段如何告诉 Electron 入口在哪
- `app.whenReady()`：建窗口前必须等它
- `win.loadFile()`：渲染进程从加载页面那一刻诞生

## 代码

**package.json**

```json
{
  "name": "electron-01-hello",
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

const createWindow = () => {
  const win = new BrowserWindow({
    width: 480,
    height: 320,
    title: '我的第一个窗口'
  })
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>hello</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>你好，Electron</h1>
  <p>这是 01 号用例：最小可运行骨架。</p>
</body>
</html>
```

## 动手改造

1. 把窗口尺寸改成 `800` × `200`，加 `resizable: false`，观察变化。
2. 给 `BrowserWindow` 加 `backgroundColor: '#1e1e1e'`，把 `body` 背景也调成同色——这就是[07 章](/part2-core/07-windows)「防白屏」的第一道防线。
3. 故意把 `main` 字段改回 `"index.js"` 再 `npm start`，亲眼见一次 `Unable to find Electron app` 报错——以后看到它，你就知道去查哪里。
