# 11 · 单实例锁

> 关联章节：[05 · 应用生命周期](/part1-background/05-lifecycle) · 难度 ★★

双击图标两次，不应该开出两个应用——两个实例抢托盘、抢端口、抢锁文件的灾难场面。`requestSingleInstanceLock` 十行解决，还附赠一个功能入口：第二实例的参数会原封不动送到老实例手里。

**知识点**

- `app.requestSingleInstanceLock()`：拿不到锁的实例应尽快退出
- `second-instance` 事件：第二实例的完整 `argv` 在这里等你（deep link、文件关联都从这里进）
- 「拉起老实例窗口」的固定套路：restore → show → focus

## 代码

**package.json**

```json
{
  "name": "electron-11-single-instance",
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
const path = require('node:path')

let win = null
let knocks = 0  // 第二实例敲门次数

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // 我是第二实例：锁已被占，送完「启动参数」的使命都没有——直接退出
  console.log('第二实例：锁已被占用，退出')
  app.quit()
} else {
  app.on('second-instance', (_e, argv) => {
    knocks++
    // argv 是第二实例的完整命令行，argv[0] 是 electron 可执行文件本身
    const args = argv.slice(1).filter((a) => !a.startsWith('--'))
    console.log(`第二实例第 ${knocks} 次敲门，参数：`, args)
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
      win.webContents.send('second-instance', { knocks, args })
    }
  })

  app.whenReady().then(() => {
    win = new BrowserWindow({
      width: 560,
      height: 380,
      webPreferences: { preload: path.join(__dirname, 'preload.js') }
    })
    win.loadFile('index.html')
  })
}
```

**preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onSecondInstance: (callback) =>
    ipcRenderer.on('second-instance', (_e, payload) => callback(payload))
})
```

**index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>single-instance</title>
</head>
<body style="font-family: sans-serif; padding: 24px">
  <h1>我是唯一的实例</h1>
  <p>保持本应用运行，另开一个终端执行：</p>
  <p><code>npm start</code>（普通启动）</p>
  <p><code>npx electron . hello --foo bar</code>（带参数启动）</p>
  <p id="log" style="color: #09c">（还没有第二实例来敲门）</p>
  <script>
    window.electronAPI.onSecondInstance(({ knocks, args }) => {
      document.getElementById('log').textContent =
        `第二实例第 ${knocks} 次敲门，参数：${JSON.stringify(args)}`
    })
  </script>
</body>
</html>
```

## 动手改造

1. 把 `if (!gotLock) app.quit()` 注释掉，再跑第二个实例——观察两个实例并存的乱象（终端两份日志、两个窗口），理解锁为什么必须最早判断。
2. `requestSingleInstanceLock({ from: 'desktop' })` 传入 `additionalData`，在 `second-instance` 的第三个参数里把它接出来（提示：回调签名是 `(event, argv, workingDirectory, additionalData)`）。
3. 结合[10 号用例](/examples/10-open-url/)：模拟 `npx electron . learn-electron://note/42`，让老实例解析并显示 deep link。
