# 系统能力

> **一句话本质**：Electron 把操作系统的桌面能力（菜单/托盘/通知/对话框/快捷键/协议）封装成**只能在主进程调用**的 API；渲染层永远只是经 IPC 触发的遥控器。

读完本篇你能获得：每个系统能力的最小可用代码与调用时机、自定义协议加载本地资源的现代写法、双平台 Deep Link 完整实现，以及全局快捷键与通知的两个高频翻车点。

## 心智模型：能力清单与统一形态

所有系统能力遵循同一个调用形态：

```text
┌─────────── 渲染进程 ───────────┐        ┌──────────── 主进程 ────────────┐
│  页面事件（点击/右键/快捷操作）    │  IPC   │  Menu / Tray / Notification …  │──► 操作系统
│  contextBridge 暴露的安全接口    │ ─────► │  全部 Node + 原生能力           │    （窗口/托盘/注册表…）
└───────────────────────────────┘        └────────────────────────────────┘
```

| 能力 | API | 关键约束 |
| --- | --- | --- |
| 菜单 | `Menu` | mac 必须保留应用菜单；上下文菜单经 IPC 触发 |
| 托盘 | `Tray` | 必须持有引用，否则被 GC 后托盘消失 |
| 通知 | `Notification` | Windows 需要设置 AppUserModelID |
| 对话框 | `dialog` | 建议传入窗口引用做成模态 |
| 全局快捷键 | `globalShortcut` | 系统级占用，必须注销 |
| 剪贴板 | `clipboard` | 读写纯文本/图片，注意敏感数据 |
| 深色模式 | `nativeTheme` / `systemPreferences` | 跟随系统或强制指定 |
| 电源/锁屏 | `powerMonitor` | 仅 ready 之后可用 |
| 多屏 | `screen` | 仅 ready 之后可用 |
| 自定义协议 | `protocol` | 注册 scheme 必须在 ready 之前 |
| 唤起链接 | `app.setAsDefaultProtocolClient` | Windows 走注册表，mac 走 open-url |

## Menu：应用菜单与上下文菜单

### 应用菜单

```js
const { app, Menu } = require('electron')

const template = [
  // macOS 要求第一个菜单是应用名菜单，缺了连复制粘贴快捷键都会失效
  ...(process.platform === 'darwin' ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  {
    label: '编辑',
    submenu: [
      { role: 'copy' },   // role 是内置动作：自动绑定快捷键与系统行为
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]
  }
]

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
})
```

优先用 `role` 而不是手写 `click`——它自动处理快捷键、输入框焦点、平台文案。Windows/Linux 上想完全去掉菜单栏时直接 `Menu.setApplicationMenu(null)`；macOS 上不行（系统强制要求），只能替换内容。

### 上下文菜单：contextBridge 转发的完整链路

右键菜单是渲染层事件驱动主进程能力的标准样板：

```js
// ---------- 渲染层 preload.js ----------
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 页面只声明"我要在某位置弹菜单"，菜单内容定义留在主进程
  popupContextMenu: (x, y) => ipcRenderer.send('context-menu', { x, y })
})
```

```js
// ---------- 渲染层页面脚本 ----------
window.addEventListener('contextmenu', (e) => {
  e.preventDefault() // 屏蔽浏览器默认菜单
  window.electronAPI.popupContextMenu(e.screenX, e.screenY)
})
```

```js
// ---------- 主进程 ----------
const { Menu, ipcMain, BrowserWindow } = require('electron')

ipcMain.on('context-menu', (event, { x, y }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  Menu.buildFromTemplate([
    { label: '复制', role: 'copy' },
    { label: '粘贴', role: 'paste' },
    { type: 'separator' },
    {
      label: '在文件夹中显示',
      click: () => { /* 业务逻辑 */ }
    }
  ]).popup({ window: win, x, y }) // 传入 window 保证菜单模态于该窗口
})
```

## Tray：托盘

```js
const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('node:path')

let tray = null // 关键：必须保持全局引用，被垃圾回收后托盘图标直接消失

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'))
  tray = new Tray(process.platform === 'darwin' ? icon : icon.resize({ width: 16 }))

  tray.setToolTip('我的应用')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => win?.show() },
    { type: 'separator' },
    { role: 'quit' }
  ]))
  // mac 上单击图标显示窗口（左键无菜单语义）
  tray.on('click', () => win?.show())
})
```

::: exp
托盘图标要按平台准备**多套尺寸**：macOS 用模板图（`tray.setTemplateImage(true)`，纯黑透明，自动适配浅色/深色菜单栏）；Windows 任务栏按 DPI 是 16/24/32px 档位，用 `nativeImage.resize` 生成整数倍尺寸，缩放模糊的高清图在托盘里最先露馅。
:::

## Notification：系统通知

```js
const { Notification } = require('electron')

function notify(title, body) {
  if (!Notification.isSupported()) return false
  const n = new Notification({ title, body, silent: false })
  n.on('click', () => win?.show()) // 点击通知拉起窗口
  n.show()
  return true
}
```

配合 [系统能力 - 坑位警报](#坑位警报) 中的 AppUserModelID 设置，Windows 通知才能正常显示与归属到应用。

## dialog：文件与消息对话框

```js
const { dialog } = require('electron')

// 打开文件选择（filters 过滤扩展名，properties 控制多选/目录模式）
async function pickImages(win) {
  const result = await dialog.showOpenDialog(win, { // 传 win：对话框模态附着到窗口
    title: '选择图片',
    filters: [
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  })
  return result.canceled ? [] : result.filePaths
}

// 保存文件：defaultPath 可以带默认文件名
async function pickSavePath(win, defaultName = '导出数据.json') {
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  return result.canceled ? null : result.filePath
}

// 消息框：替代 window.alert（alert 会阻塞渲染进程且样式脱离系统）
async function confirmExit(win) {
  const { response } = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['退出', '取消'],
    defaultId: 1,           // 默认聚焦"取消"，危险操作永远给安全默认
    message: '有任务正在下载，确定退出吗？'
  })
  return response === 0
}
```

## globalShortcut：全局快捷键

```js
const { globalShortcut, app } = require('electron')

app.whenReady().then(() => {
  const ok = globalShortcut.register('CommandOrControl+Alt+K', () => {
    toggleWindow() // 全局唤起/隐藏主窗口，应用未聚焦也要能响应
  })
  if (!ok) console.warn('快捷键注册失败：可能已被其他应用占用')
})

// 必须注销：不清理则快捷键残留为系统级占用，直到进程真正退出
app.on('will-quit', () => globalShortcut.unregisterAll())
```

## clipboard 与 nativeTheme

```js
const { clipboard, nativeTheme } = require('electron')

// 剪贴板：注意敏感内容读取的最小权限原则
clipboard.writeText('要分享的文本')
clipboard.readText()
clipboard.readImage() // 读取图片，可配合截图功能

// 深色模式：跟随系统
nativeTheme.on('updated', () => {
  const isDark = nativeTheme.shouldUseDarkColors
  // 广播给所有窗口，渲染层据此切换主题
})
nativeTheme.themeSource = 'system' // 'dark' | 'light' | 'system'（强制指定会覆盖系统）
```

## powerMonitor 与 screen

```js
const { app, powerMonitor, screen } = require('electron')

app.whenReady().then(() => {
  // 电源/锁屏事件：挂起前保存状态，解锁后刷新数据
  powerMonitor.on('suspend', () => persistAllState())   // 系统挂起前
  powerMonitor.on('resume', () => refreshLiveInfo())    // 从挂起恢复
  powerMonitor.on('lock-screen', () => lockUI())        // 锁屏（桌面应用常用于锁界面）
  powerMonitor.on('unlock-screen', () => unlockUI())

  // 多屏：拿到窗口所在显示器的工作区（不含任务栏/Dock）
  const { workArea } = screen.getDisplayMatching(win.getBounds())
  console.log('当前屏工作区：', workArea)
  // 鼠标所在屏幕（把窗口送到用户眼前的屏）
  const activeDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
})
```

`screen` 与 `powerMonitor` 都只能在 `app.ready` 之后使用——模块加载时显示器信息尚未就绪。

## 自定义协议：加载本地资源的现代写法

直接用 `file://` 加载页面会遇到跨域、CSP、路径安全一串问题。现代做法是注册一个行为像 `https://` 的私有协议：

```js
const { app, protocol, net } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

// 必须在 app ready 之前注册 scheme（只在首次 require 阶段调用一次）
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'myapp',
    privileges: {
      standard: true,       // 有 host 概念，行为像 http(s) 页面
      secure: true,         // 视为安全上下文（location.protocol 为 myapp:）
      supportFetchAPI: true // 页面内可用 fetch
    }
  }
])

app.whenReady().then(async () => {
  // ready 后注册 handler：myapp://local/xxx.html 映射到磁盘文件
  protocol.handle('myapp', (request) => {
    const { pathname } = new URL(request.url)
    const filePath = path.join(__dirname, 'renderer', decodeURIComponent(pathname))
    // 用 net.fetch 走 file URL 生成标准 Response，自动处理 MIME 与流式响应
    return net.fetch(pathToFileURL(filePath).toString())
  })

  win.loadURL('myapp://local/index.html')
})
```

旧教程里的 `protocol.registerFileProtocol` 已废弃，`protocol.handle` 是 Electron 25+ 的唯一推荐写法。

## Deep Link：从浏览器唤起应用

目标：用户在浏览器点击 `myapp://open?id=42`，系统唤起你的应用并处理参数。三个平台机制完全不同：

```js
const { app } = require('electron')

const PROTOCOL = 'myapp'

// ---- 单实例锁：Windows 上每次唤起都会启动新进程，必须收敛到首个实例 ----
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (event, argv) => {
    // Windows/Linux：后续唤起的 URL 在第二实例的 argv 里
    const url = argv.find((a) => a.startsWith(`${PROTOCOL}://`))
    if (url) handleDeepLink(url)
    win?.show() // 唤起时把窗口带到前台
  })

  // ---- 协议注册 ----
  if (process.env.NODE_ENV === 'development') {
    // 开发模式：注册的是当前 node 进程可执行文件 + 脚本路径
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1] ?? '.')
    ])
  } else {
    // 打包模式：注册当前 exe（正式安装包通常由安装器写入注册表，这里是兜底）
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

// macOS：系统把 URL 直接发给正在运行的应用实例（无第二进程）
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

// 统一入口：解析协议参数并路由
function handleDeepLink(url) {
  const parsed = new URL(url) // myapp://open?id=42
  const id = parsed.searchParams.get('id')
  if (parsed.host === 'open' && id) {
    win?.webContents.send('deep-link', { id })
  }
}
```

- **Windows**：协议关联存在注册表 `HKCU\Software\Classes\myapp\...`。开发模式必须用上面三参数形式，否则双击链接唤起的是打包后的旧应用。
- **macOS**：打包时要在 `Info.plist` 声明 `CFBundleURLTypes`，运行期只会收到 `open-url` 事件。
- **Linux**：需要安装 `.desktop` 文件并在其中声明 `MimeType=x-scheme-handler/myapp`。

## 实战要点

::: exp
**1. 全局快捷键当"系统资源"管理。** 它是全局排他的系统级占用——除了 `will-quit` 清理，还要在意向退出、捕获到致命错误准备重启时都先 `unregisterAll()`。应用崩溃残留的快捷键会让"重启后注册失败"，用户只能注销系统会话才能恢复。

**2. 托盘图标按平台准备多套尺寸。** 16px（Windows 100% DPI）、24/32px（高 DPI）、mac 模板图各一套，用 `nativeImage` 组装后按当前屏缩放比取最近尺寸。不要指望一张大图自动缩放，托盘区域的缩放质量最差。
:::

## 坑位警报

::: pitfall
**1. Windows 通知不显示：缺 AppUserModelID。** Windows 通过 AppUserModelID 把通知归属到开始菜单里的应用；Electron 默认没有，通知会发不出来或归属到 "electron.exe"。在 `app ready 之前` 设置一次：

```js
// 放在主进程入口最前面（ready 之前），与打包配置里的 appId 保持一致
if (process.platform === 'win32') {
  app.setAppUserModelId('com.yourcompany.yourapp')
}
```

**2. globalShortcut 是系统级排他占用。** 两个应用注册同一个组合键，后注册的会失败（`register` 返回 `false`，不抛异常）。启动时必须检查返回值；用户自定义快捷键功能要把"注册失败 → 提示换键"作为一等交互，而不是静默吞掉。
:::

## 延伸阅读

- [Menu API](https://www.electronjs.org/docs/latest/api/menu) / [Tray API](https://www.electronjs.org/docs/latest/api/tray)
- [Notification API](https://www.electronjs.org/docs/latest/api/notification) / [通知教程](https://www.electronjs.org/docs/latest/tutorial/notifications)
- [Dialog API](https://www.electronjs.org/docs/latest/api/dialog) / [Global Shortcut API](https://www.electronjs.org/docs/latest/api/global-shortcut)
- [Protocol API](https://www.electronjs.org/docs/latest/api/protocol) — 自定义协议全量 API
- [Native Theme API](https://www.electronjs.org/docs/latest/api/native-theme) / [Screen API](https://www.electronjs.org/docs/latest/api/screen) / [深色模式教程](https://www.electronjs.org/docs/latest/tutorial/dark-mode)
