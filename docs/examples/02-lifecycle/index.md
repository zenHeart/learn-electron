# 02 · 生命周期观察

> 关联章节：[05 · 应用生命周期](/part1-background/05-lifecycle) · 难度 ★

同一个应用，在 Windows 和 macOS 上「关掉最后一个窗口」的结局不同。这个用例用 `console.log` 把每个生命周期事件打在终端里，让你亲手触发、亲眼对比。

**知识点**

- `window-all-closed`：三平台分歧点（非 macOS 退出，macOS 驻留）
- `activate`：macOS 的「复活」入口，以及为什么必须判断窗口数
- 主进程日志打在**终端**，不在 DevTools——两个日志世界的第一次体验

## 代码

**package.json**

```json
{
  "name": "electron-02-lifecycle",
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

console.log(`[启动] 主进程已加载，平台: ${process.platform}`)

const createWindow = () => {
  const win = new BrowserWindow({ width: 520, height: 360 })
  win.loadFile('index.html')
  win.on('closed', () => console.log('[事件] 窗口已销毁'))
}

app.whenReady().then(() => {
  console.log('[事件] ready —— 现在才允许建窗口/托盘/菜单')
  createWindow()
})

app.on('window-all-closed', () => {
  console.log('[事件] window-all-closed（所有窗口已关闭）')
  if (process.platform !== 'darwin') {
    console.log('  → 非 macOS：app.quit()，应用退出')
    app.quit()
  } else {
    console.log('  → macOS：应用驻留 Dock，不退出')
  }
})

app.on('activate', () => {
  console.log('[事件] activate（用户点了 Dock 图标）')
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('  → 一个窗口都没有，重建')
    createWindow()
  } else {
    console.log('  → 已有窗口，什么都不做（否则会开重复窗口）')
  }
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>lifecycle</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>生命周期观察台</h1>
  <p>操作步骤（事件日志打在启动应用的终端里）：</p>
  <ol>
    <li>关闭这个窗口 → 终端打印 window-all-closed</li>
    <li>macOS：应用没死，再点 Dock 图标 → activate → 窗口重建</li>
    <li>Windows / Linux：应用已随之退出</li>
  </ol>
</body>
</html>
```

## 动手改造

1. 把 `activate` 里的窗口数判断删掉，在 macOS 上连点两次 Dock 图标——复现「重复窗口」这个新手最常见 bug。
2. 加一个 `app.on('before-quit', ...)` 打印日志，观察退出链的先后顺序（对照[05 章](/part1-background/05-lifecycle)的四钩子表格）。
3. 进阶：拦截 `close` 事件改成「隐藏不销毁」（05 章「关闭 ≠ 销毁」小节的套路），让 `window-all-closed` 永远不触发。
