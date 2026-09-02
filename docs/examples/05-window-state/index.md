# 05 · 记住窗口位置

> 关联章节：[07 · 窗口体系](/part2-core/07-windows) · 难度 ★★★

用户把窗口拖到副屏、最大化后退出——下次打开回到默认位置，是桌面应用最容易被骂的细节。这个用例是窗口状态持久化的教学版，踩掉两个经典坑：最大化陷阱与离屏恢复。

**知识点**

- `app.getPath('userData')`：每个平台唯一保证可写的「应用之家」
- `getNormalBounds()` vs `getBounds()`：最大化时存 `getBounds()` 会把「全屏尺寸」当成正常尺寸存下来
- 离屏校验：副屏被拔掉后，上次的位置落在任何一块现存屏幕之外——必须回退默认值
- `show: false` + `ready-to-show`：防白屏三件套（07 章）

## 代码

**package.json**

```json
{
  "name": "electron-05-window-state",
  "version": "0.1.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

**main.js**

```js
const { app, BrowserWindow, screen } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const stateFile = path.join(app.getPath('userData'), 'window-state.json')

// 读状态：任何异常（文件不存在 / JSON 损坏）都当作「没有状态」
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  } catch {
    return null
  }
}

// 离屏校验：窗口至少要有一部分落在某块现存屏幕的工作区内
function isVisible(state) {
  if (!state || typeof state.x !== 'number') return false
  return screen.getAllDisplays().some((d) => {
    const wa = d.workArea
    return state.x < wa.x + wa.width &&
           state.x + state.width > wa.x &&
           state.y < wa.y + wa.height &&
           state.y + state.height > wa.y
  })
}

function createWindow() {
  const saved = loadState()
  const valid = isVisible(saved)

  const win = new BrowserWindow({
    width: valid ? saved.width : 800,
    height: valid ? saved.height : 600,
    x: valid ? saved.x : undefined,   // 不传则由系统摆放
    y: valid ? saved.y : undefined,
    show: false,
    backgroundColor: '#ffffff'
  })
  if (saved && saved.isMaximized) win.maximize()
  win.once('ready-to-show', () => win.show())

  // 关窗时存档。用 getNormalBounds：最大化时拿「还原后」的尺寸，
  // 直接 getBounds() 会存下全屏尺寸——下次打开就是一个铺满的窗口
  win.on('close', () => {
    const bounds = win.getNormalBounds()
    fs.writeFileSync(stateFile, JSON.stringify({
      ...bounds,
      isMaximized: win.isMaximized()
    }, null, 2))
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>window-state</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>窗口状态记忆</h1>
  <p>1. 拖动窗口 / 调整大小 / 最大化 → 2. 关闭应用 → 3. 重新 npm start</p>
  <p>窗口会回到上次的位置和尺寸。</p>
</body>
</html>
```

## 动手改造

1. 把 `win.getNormalBounds()` 换成 `win.getBounds()`，重复「最大化 → 退出 → 重开」，亲眼看最大化陷阱长什么样。
2. 再加一个状态：`isFullScreen`（提示：`win.isFullScreen()` / `win.setFullScreen(true)`）。
3. 把存档点从 `close` 挪到 `resize`/`move` 事件（提示：要防抖），对比两种策略的掉电风险——07 章会告诉你为什么教程都选 `close`。
