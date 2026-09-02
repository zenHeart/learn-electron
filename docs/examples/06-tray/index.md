# 06 · 托盘常驻

> 关联章节：[11 · 系统能力](/part2-core/11-system) · 难度 ★★★

下载器、IM、音乐播放器的共同形态：点关闭不退出，收进托盘。这个用例实现「关闭 = 隐藏」组合拳，图标用 base64 内嵌——整份代码复制即跑，不需要准备图片文件。

**知识点**

- `Tray` 引用必须一直持有——局部变量被 GC，托盘图标会凭空消失（高频玄学坑）
- `close` 事件 `preventDefault()` + `hide()`：关闭 ≠ 退出
- `isQuitting` 自维护标记：托盘菜单「退出」时放行真正的退出链
- `nativeImage.createFromDataURL`：代码里直接造图标

## 代码

**package.json**

```json
{
  "name": "electron-06-tray",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')

// 16×16 PNG 的 base64：不依赖任何图片文件，整个用例自包含
const ICON_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANklEQVR4nGNgQAaTdvwnCmMF' +
  'xGrGagipmlEMIVcz3JBBawA6GIkGDHwsEG8AxUmZKpmJguwMAA5RLXfaJ6v/AAAAAElFTkSuQmCC'

let win = null
let tray = null          // 必须持有引用！改成局部变量，托盘图标会被 GC 掉
let isQuitting = false   // 「真的要退出」标记

function createWindow() {
  win = new BrowserWindow({ width: 480, height: 320 })
  win.loadFile('index.html')
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()   // 拦下「真的关闭」
      win.hide()           // 收进托盘，DOM 状态还在
    }
    // isQuitting 为 true 时放行，走正常退出链
  })
}

app.whenReady().then(() => {
  createWindow()

  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${ICON_PNG}`)
  tray = new Tray(icon)
  tray.setToolTip('我的常驻工具（点关闭不退出）')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示窗口', click: () => { win.show(); win.focus() } },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit() } }
  ]))
  // macOS：点托盘图标切换显示；Windows 常用 double-click
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()))
})

app.on('window-all-closed', () => {
  // 实际上永远不会走到这里：close 被拦截，窗口从未「全部关闭」。
  // 但按惯例保留，防止未来有人改掉拦截逻辑后应用关不掉
  if (process.platform !== 'darwin') app.quit()
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>tray</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>我住在托盘里</h1>
  <p>点窗口的关闭按钮 → 我只是藏起来了，托盘图标还在。</p>
  <p>真正的退出在：托盘右键菜单 → 退出。</p>
</body>
</html>
```

## 动手改造

1. 把 `let tray = null` 改成 `whenReady` 回调里的局部变量 `const tray = ...`，跑起来等几十秒——复现托盘图标凭空消失（GC 时机不定，消失只是迟早）。
2. 让 `tooltip` 动态化：窗口显示时显示「运行中」，隐藏时显示「已收起」（提示：在 hide/show 处调用 `tray.setToolTip`）。
3. macOS 进阶：加 `app.dock.hide()`，让应用从 Dock 消失、只活在托盘（对照官方 [macOS Dock 集成教程](https://www.electronjs.org/docs/latest/tutorial/macos-dock)）。
