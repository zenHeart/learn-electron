# 窗口管理

> **一句话本质**：一个 `BrowserWindow` = 一个独立 Chromium 渲染进程 + 一个原生窗口句柄；窗口管理的全部复杂度都来自两件事——**多窗口的进程成本**与**跨平台的坐标系差异**。

读完本篇你能获得：BrowserWindow 创建参数的分组心智图、防白屏标准姿势、可直接落地的窗口状态持久化代码、多窗口架构两种流派的选型依据，以及三个生产环境高频踩坑的防御写法。

## 心智模型：窗口不是"DOM 里的一个盒子"

Web 开发者的本能是把"窗口"想象成 `window.open` 弹出的浏览器标签——共享同一个页面进程，成本近乎为零。Electron 里完全不是：

```text
┌────────────────────────── 一个 Electron 应用 ──────────────────────────┐
│                                                                       │
│  主进程（唯一）                                                        │
│   ├─ BrowserWindow A ──► 原生窗口句柄 A + 渲染进程 A（独立 Chromium）    │
│   ├─ BrowserWindow B ──► 原生窗口句柄 B + 渲染进程 B（独立 Chromium）    │
│   └─ BrowserWindow C ──► 原生窗口句柄 C + 渲染进程 C（独立 Chromium）    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

- 每个 BrowserWindow 背后是**一个完整的渲染进程**（含独立 V8、Blink 合成器），空窗口大约占用几十 MB 内存。
- 窗口的创建、移动、关闭全部由**主进程**操作原生句柄完成，渲染层只能通过 IPC 请求。
- 因此窗口管理的核心决策只有一个：**这个界面值不值得一个进程？**

## BrowserWindow 创建参数精讲

构造参数有四十多个，死记没有意义。按"它控制什么"分四组，遇到问题按组排查。

### 第一组：尺寸与位置

| 参数 | 说明 | 实战提醒 |
| --- | --- | --- |
| `width` / `height` | 初始尺寸，默认 800×600 | 记得设 `minWidth`/`minHeight`，否则窗口可以被拖到 0×0 |
| `x` / `y` | 初始位置（屏幕坐标系，原点在主屏左上角，y 轴向下） | 不传由系统决定；多屏恢复场景必须校验（见下文状态持久化） |
| `useContentSize` | 尺寸指内容区而非含边框标题栏的整体 | 做精确布局时开启，避免各平台标题栏高度差异 |
| `center` | 初始居中 | 与 `x`/`y` 互斥，居中优先 |

### 第二组：外观

| 参数 | 说明 | 实战提醒 |
| --- | --- | --- |
| `frame` | 是否有系统边框和标题栏，默认 `true` | 设 `false` 后 Windows 上窗口失去系统阴影，需要自己补 `hasShadow: true` |
| `transparent` | 窗口透明 | 不能与 `frame: true` 共存；Linux 部分环境不支持 |
| `backgroundColor` | 窗口底色 | **防白屏第一道防线**，设为应用背景色而非默认白 |
| `titleBarStyle` | mac 专属（`hidden`/`hiddenInset` 等） | 配合 `trafficLightPosition` 定制红绿灯位置 |

### 第三组：行为

| 参数 | 说明 | 实战提醒 |
| --- | --- | --- |
| `resizable` / `movable` / `minimizable` / `maximizable` / `closable` | 各项窗口能力开关 | 通知类浮窗通常全关 + `focusable: false` |
| `alwaysOnTop` | 置顶 | 有层级参数可控制置顶档位 |
| `skipTaskbar` | 不出现在任务栏/Dock | 配合托盘常驻应用使用 |
| `show` | 初始是否显示，默认 `true` | **生产应用建议一律 `false`**，配合 ready-to-show |
| `parent` / `modal` | 父子关系与模态 | 见下文专节 |

### 第四组：webPreferences 关键项（Electron 34+ 默认值）

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `contextIsolation` | `true` | 渲染页与 preload 隔离，**永远不要关** |
| `sandbox` | `true`（Electron 20+） | 渲染进程沙箱化，**永远不要关** |
| `nodeIntegration` | `false` | 渲染页直接用 Node 能力，**永远不要开** |
| `preload` | 无 | 唯一合法的桥接层入口 |
| `webSecurity` | `true` | 同源策略等安全开关，**永远不要关** |
| `partition` | 继承默认会话 | 多身份/嵌入第三方内容时用来隔离 Cookie 与存储 |

前四项的默认值组合就是现代 Electron 的安全基线。网上老教程里 `nodeIntegration: true` 的写法在 Electron 34+ 项目里应一律视为错误。

## 防白屏三板斧

窗口先 `show()` 再等页面加载，用户会先看到一帧白屏（或 `backgroundColor` 的纯色），观感廉价。标准解法是三件套：

```js
const win = new BrowserWindow({
  show: false,               // 1. 创建时隐藏
  backgroundColor: '#1e1e1e' // 2. 底色与应用背景一致，过渡不突兀
})

win.once('ready-to-show', () => {
  // 3. 渲染进程完成首次绘制后再显示
  win.show()
})
```

`ready-to-show` 由渲染进程首次完成合成帧时触发，是"用户看到完整界面"最早的可靠信号。

::: pitfall
`ready-to-show` **必须用 `once` 且要防御永不触发的场景**。页面加载失败（网络断开、入口文件路径错误）时该事件可能迟迟不来，窗口就"消失"了。给一个兜底超时：

```js
const SHOW_TIMEOUT = 3000 // 兜底：最多等 3 秒
const showWin = () => { if (!win.isDestroyed() && !win.isVisible()) win.show() }
win.once('ready-to-show', showWin)
setTimeout(showWin, SHOW_TIMEOUT)
```
:::

## 窗口状态持久化：完整可用实现

用户把窗口拖到副屏、调成半屏、最大化后退出——下次打开回到默认位置，是桌面应用最容易被骂的细节。完整实现要处理四个边界：**离屏恢复**（副屏被拔掉）、**最大化态**（直接存 bounds 会存成全屏尺寸）、**关机瞬间写盘**、**文件损坏**。

```js
const { app, BrowserWindow, screen } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const stateFile = path.join(app.getPath('userData'), 'window-state.json')

// 读取状态：任何异常都当作"没有状态"，绝不抛错阻断启动
function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'))
  } catch {
    return null
  }
}

// 校验：保存的位置是否还落在某个现存显示器的工作区内
// （防止恢复到已被拔掉的副屏外，窗口"打开即消失"）
function isVisibleOnAnyDisplay(state) {
  if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) return false
  const visible = ({ workArea }) =>
    state.x < workArea.x + workArea.width &&
    state.x + state.width > workArea.x &&
    state.y < workArea.y + workArea.height &&
    state.y + state.height > workArea.y
  return screen.getAllDisplays().some(visible)
}

// 保存状态：getNormalBounds() 直接返回"还原态"的 bounds，
// 窗口处于最大化/全屏时也能拿到正确的还原尺寸，无需手动 unmaximize
function saveWindowState(win) {
  if (win.isDestroyed()) return
  const { x, y, width, height } = win.getNormalBounds()
  const state = { x, y, width, height, isMaximized: win.isMaximized() }
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state))
  } catch (err) {
    console.warn('窗口状态保存失败：', err.message)
  }
}

function createWindow() {
  const saved = loadWindowState()
  const options = {
    width: saved?.width ?? 1200,
    height: saved?.height ?? 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#1e1e1e'
  }
  // 只有通过"仍在可视区域内"校验才恢复坐标，否则交给系统默认摆放
  if (saved && isVisibleOnAnyDisplay(saved)) {
    options.x = saved.x
    options.y = saved.y
  }
  const win = new BrowserWindow(options)
  if (saved?.isMaximized) win.maximize()

  win.once('ready-to-show', () => win.show())

  // 正常关闭路径
  win.on('close', () => saveWindowState(win))
  return win
}

app.whenReady().then(createWindow)

// Windows 关机/注销前只会给 session-end，不会触发每个窗口的 close
app.on('session-end', () => {
  BrowserWindow.getAllWindows().forEach(saveWindowState)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

## 父子窗口与模态

需要"必须处理完才能回去"的对话框式交互时，用 `parent` + `modal`：

```js
const child = new BrowserWindow({
  parent: mainWin,
  modal: true,      // 模态：父窗口被禁用
  width: 480,
  height: 320,
  show: false
})
child.once('ready-to-show', () => child.show())
```

平台表现差异要心里有数：

| 行为 | Windows / Linux | macOS |
| --- | --- | --- |
| 模态表现 | 独立窗口，父窗口禁用并置灰 | 悬挂在父窗口顶部的 sheet 样式 |
| 父窗口最小化 | 子窗口随之隐藏 | 子窗口随之隐藏 |
| 父窗口关闭 | 子窗口一并销毁 | 子窗口一并销毁 |

模态只是**禁用父窗口的输入**，并不会阻塞主进程代码执行——不要写出"打开模态窗后同步等结果"的代码，结果仍然通过事件/回调回传。

## 多窗口架构：两种流派

做多窗口应用（主界面 + 各种浮窗/工具窗）时，先做一次架构选型，后补的成本极高。

| 维度 | 流派一：每功能一个 `new BrowserWindow()` | 流派二：单窗口 + `window.open` 命名子窗 |
| --- | --- | --- |
| 创建方式 | 主进程显式 new | 渲染层 `window.open(url, frameName)` 触发 |
| 进程成本 | 每窗一个渲染进程，全量冷启动 | 同名窗口复用已有渲染进程，二次打开近乎零成本 |
| 参数控制 | 主进程全权控制 | `setWindowOpenHandler` 按 `frameName` 差异化注入 |
| 隔离性 | 窗口间完全隔离，一个崩溃不殃及 | 复用进程的窗口之间有一定耦合 |
| 适用场景 | 主界面、设置页等"重"界面 | 通知、挂件、工具条等"轻"浮窗 |
| 代码规模 | 窗口多了以后管理代码容易失控 | 天然集中：一个 handler 管所有子窗 |

结论先行：**重界面走流派一，浮窗类走流派二**。流派二把"窗口长什么样"收敛成一张配置表，是防代码爆炸的关键。

### 流派二完整实现：setWindowOpenHandler 按 frameName 差异化

```js
// ---------- 主进程 ----------
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')

// 子窗规格注册表：所有命名子窗在这里声明，未声明的一律拒绝
const CHILD_WINDOW_PRESETS = {
  // 通知浮窗：无焦点、置顶、不进任务栏
  notification: {
    width: 360, height: 200,
    frame: false, resizable: false, skipTaskbar: true,
    focusable: false, alwaysOnTop: true
  },
  // 桌面挂件：小窗常驻
  widget: {
    width: 320, height: 480,
    frame: false, resizable: false, alwaysOnTop: true
  },
  // 工具条窗：贴边可调
  toolbox: {
    width: 280, height: 720,
    resizable: true
  }
}

function attachChildWindowPolicy(win) {
  // 拦截渲染层所有 window.open 调用
  win.webContents.setWindowOpenHandler(({ url, frameName }) => {
    const preset = CHILD_WINDOW_PRESETS[frameName]
    if (!preset) return { action: 'deny' } // 未注册的窗口名一律拒绝

    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        show: false, // 统一走 ready-to-show，防白屏策略不因流派而破
        webPreferences: { sandbox: true },
        ...preset
      }
    }
  })

  // 子窗创建后的二次定制时机（比如把通知窗贴到父窗口右上角）
  win.webContents.on('did-create-window', (child) => {
    child.once('ready-to-show', () => child.show())
  })
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200, height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  })
  attachChildWindowPolicy(win)
  win.once('ready-to-show', () => win.show())
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  return win
}

app.whenReady().then(createMainWindow)
```

```js
// ---------- 渲染层（renderer/index.html 内联脚本即可验证） ----------
// 打开命名子窗：第二参数就是 frameName，与注册表的 key 对应
// 浏览器语义：同名窗口已存在时复用而不是再开一个——浮窗"只开一份"免费实现
window.open('notification.html', 'notification')

// 传参走 URL query（features 传不了结构化数据）
window.open('widget.html?mode=compact', 'widget')
```

子窗向主窗回传消息不受流派影响，仍然是标准 IPC（preload + `contextBridge`），见 [IPC 通信](/guide/05-ipc)。

## 进阶：多标签多账号——BaseWindow + WebContentsView 三层结构

一个窗口里承载 N 个独立身份的工作区（多账号客服台、多店铺运营、多邮箱）时，第三种流派胜出：**BaseWindow 只做窗口壳，里面叠 WebContentsView**：

```text
BaseWindow（无原生内容）
 ├─ TabBarView    高 48px 的标签栏视图（独立 webContents，永不切换）
 ├─ ContentView   当前激活标签的内容视图（每账号一个实例，切换 = 换视图）
 └─ TipView       全屏覆盖层（全局确认弹层，置顶时临时挂载）
```

关键实现细节：

```js
// 每个账号一个独立 partition：session/cookie/存储全隔离
const view = new WebContentsView({
  webPreferences: { partition: `persist:account-${id}` }  // persist: 前缀 = 持久化分区
})

// 无缝切换：先加后删——旧视图立即移除会闪白帧
function switchTab(newView, oldView) {
  win.contentView.addChildView(newView)
  setTimeout(() => win.contentView.removeChildView(oldView), 100)  // 经验值 100ms
}

// resize 手动跟随 + 销毁时解绑（WebContentsView 不自动跟随窗口）
const onResize = () => layoutView(newView)
win.on('resize', onResize)
// 关标签时：win.off('resize', onResize) + removeChildView —— 成对清理防泄漏
```

::: exp 实战经验（多账号场景三件套）
①**错峰启动**：自动登录恢复 10+ 个标签时逐个延迟加载（第 i 个延迟 `(i-1)×5s`），否则带宽/CPU/内存同时雪崩；②**手动模拟 visibility**：WebContentsView 切到后台不会触发 `visibilitychange`，要自己向新旧视图广播 `show/hide` 事件，让壳内页面知道该停轮询了；③**登录窗隐藏复用**：登录成功只 `hide()` 不销毁并预热下一次，「新增账号」秒开。
:::

## 实战要点

::: exp
**1. 浮窗类窗口优先 `window.open` 方案。** 实测同规格子窗，`window.open` 复用已存在的渲染进程，比每次 `new BrowserWindow()` 打开更快、常驻内存更低。通知、挂件这类高频开关的轻窗口，收益最明显。

**2. 抽象一个窗口基类，对抗窗口管理代码爆炸。** 窗口超过 5 个就该收敛了：统一的 `create()`（show:false + ready-to-show + 状态恢复）、统一的 `safeClose()`（确认弹窗 + 清理定时器）、统一的命名注册表（流派二的 PRESETS 就是最小形态）。所有窗口共用一份生命周期代码，新增窗口只加配置。
:::

## 坑位警报

::: pitfall
**1. 向已关闭窗口发消息抛 `Object has been destroyed`。** 窗口关闭是异步的，事件回调里常拿着旧引用发送。**所有发送前必须守卫**，封装成统一入口：

```js
// 安全发送封装：所有主进程 → 窗口的消息都走这里
function sendToWin(win, channel, ...args) {
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return false
  try {
    win.webContents.send(channel, ...args)
    return true
  } catch (err) {
    console.warn(`[sendToWin] ${channel} 发送失败：`, err.message)
    return false
  }
}
```

**2. DPI/分辨率变化后 `setPosition`/`setBounds` 静默失效。** 窗口跨屏拖拽、显示器缩放比变化后（尤其是最大化状态下），几何设置可能被 Chromium/系统吞掉。防御写法：先 `restore()` 解除最大化锁定，再在 `focus` 事件里二次校准：

```js
function moveWindowSafe(win, x, y) {
  if (win.isDestroyed()) return
  if (win.isMaximized()) win.restore() // 最大化状态下 setPosition 会被忽略
  win.setPosition(x, y)
  // 部分平台要等窗口真正获得焦点后才应用几何属性，二次校准兜底
  win.once('focus', () => {
    if (win.isDestroyed()) return
    const [cx, cy] = win.getPosition()
    if (cx !== x || cy !== y) win.setPosition(x, y)
  })
}
```

**3. 隐藏窗口前先把内容藏掉，防"下次显示闪旧帧"。** 隐藏/后台窗口会被 Chromium 降级渲染（降低帧率、暂停合成），直接 `hide()` 再 `show()` 时可能闪现冻结的旧帧。标准流程是先让页面停止绘制再隐藏：

```js
async function hideGracefully(win) {
  if (!win || win.isDestroyed()) return
  // 先把内容从合成管线里摘掉，再隐藏窗口
  await win.webContents
    .executeJavaScript("document.body.style.visibility='hidden'", false)
    .catch(() => {})
  win.hide()
  // 隐藏后立即恢复，下次 show 直接出完整帧
  win.webContents
    .executeJavaScript("document.body.style.visibility=''", false)
    .catch(() => {})
}
```
:::

## 延伸阅读

- [BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window) — 全部构造参数与实例方法
- [窗口定制教程](https://www.electronjs.org/docs/latest/tutorial/window-customization) — 无边框窗口、标题栏按钮定制
- [窗口状态持久化教程](https://www.electronjs.org/docs/latest/tutorial/window-state-persistence) — 官方对窗口状态保存的完整讨论
- [离屏渲染教程](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering) — 不显示窗口的渲染用法
- [BaseWindow API](https://www.electronjs.org/docs/latest/api/base-window) — 纯窗口壳，与 WebContentsView 组合的现代窗口方案（见[嵌入 Web 内容](/guide/09-webview)）
