# 新人第一课：第一个应用

> **一句话本质：一个 Electron 应用 = 一个 Node 入口（主进程）开出一个加载了网页的窗口——你的整个新手期，就是把「哪个进程放什么代码、两个进程怎么对话」亲手撞一遍。**

读完这一篇，你将从「读过进程模型」变成「跑过第一个应用」：亲手装好环境、写出最小三件套、触发人生第一次 IPC、踩掉第一批人人都踩的坑。本章不追求完整，只追求一件事——把[第 04 章](/part1-background/04-process-model)的抽象概念全部落到你的指尖上。

## 从一个真实需求开始

你刚接到一个需求：团队要一个桌面小工具——双击图标就能打开、能读本地文件、能弹系统通知、三个操作系统都要能用。Web 页面做不到（浏览器沙箱不让碰这些），原生开发三端各写一套成本又太高。你选了 Electron。现在，从零开始。

### 第一步：安装，以及两百 MB 的真相

找个空目录，两步：

```bash
mkdir team-tool && cd team-tool
npm init -y          # 生成 package.json
npm install electron # 安装 Electron 运行时
```

如果你在国内网络，第二条命令大概率会卡住：`electron` 这个 npm 包本身只有几 MB，但安装时要另行下载一百多 MB 的平台二进制包（默认源在国外），症状是长时间停在 `postinstall` 或直接 `read ECONNRESET`。设一个镜像再装：

```bash
# 单次生效
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm install electron

# 永久生效（推荐）：写进项目 .npmrc，全团队成员自动受益
echo "electron_mirror=https://npmmirror.com/mirrors/electron/" >> .npmrc
```

装完瞄一眼 `node_modules`——两百多 MB。这不是依赖装多了：`node_modules/electron/dist/` 里是一份**完整的 Chromium 浏览器加 Node.js 运行时**。回想[第 01 章](/part1-background/01-what-is-electron)的结论——Electron 应用分发的就是「浏览器 + 你的代码」，你刚装下的正是那个浏览器。这也解释了为什么 Electron 应用的安装包普遍几十 MB 起步：体积在第一天就注定了。

::: pitfall
**不要 `npm install -g electron` 全局安装。** Electron 是每个项目锁版本的**运行时**，不是命令行工具：全局装一份意味着所有项目被迫共享同一个版本，而真实项目必须把 `electron` 声明在 `devDependencies` 里锁死版本，否则「我这能跑你那不能跑」会成为团队日常。全局装的 `electron` 还会被打包工具视为缺依赖。记住一条：`electron` 永远装在项目里；你未来全局安装的会是 `@electron/get`、`electron-builder` 这类真正的工具。
:::

## 三件套：package.json、main.js、index.html

### package.json：main 字段是总开关

`npm init -y` 生成的文件里，有两处必须改——这是你的第一道新人关卡：

```json
{
  "name": "team-tool",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

- **`main`**：主进程入口文件。`npm init -y` 默认写的是 `"index.js"`，而我们的入口叫 `main.js`——忘了改它，`npm start` 直接报错（后面那个 pitfall 会重现这一幕）。
- **`scripts.start`**：`electron .` 的意思是「用 Electron 运行当前目录这个应用」，Electron 会读 `package.json` 的 `main` 找到入口。

### main.js：第一个窗口，逐行读懂

```js
// main.js —— 主进程入口：Node.js 完整环境，全应用唯一
const { app, BrowserWindow } = require('electron')
// app           应用本体：生命周期事件（启动、退出）都挂在它身上
// BrowserWindow 窗口工厂：new 一个 = 开一个窗口（背后起一个渲染进程）

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,      // 初始尺寸，像素
    height: 600
  })
  win.loadFile('index.html')  // 窗口加载这个页面，渲染进程从此诞生
}

// GUI 能力（窗口/托盘/菜单）必须等 Chromium 初始化完成，
// whenReady() 是官方推荐的等待方式——ready 之前建窗口会直接报错
app.whenReady().then(createWindow)

// 往下两段是生命周期惯例，完整事件流见第 05 章
app.on('window-all-closed', () => {
  // Windows / Linux 惯例：最后一个窗口关了，应用就该退出
  if (process.platform !== 'darwin') app.quit()
  // macOS 惯例：应用驻留 Dock，什么都不做
})

app.on('activate', () => {
  // macOS：用户点了 Dock 图标，但一个窗口都没有 → 重建一个
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```

主进程代码只有三件事：等 `ready`、建窗口、按平台惯例处理退出。你写下的每一行都跑在 Node 世界里——`require`、`process`、文件系统，全都可用。

### index.html：它真的只是一个网页

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>团队小工具</title>
</head>
<body>
  <h1>你好，Electron</h1>
  <p>这是我的第一个桌面应用</p>
</body>
</html>
```

没有任何特殊之处——这就是一个普通网页。Electron 的分工在这一刻已经定型：**界面用 Web 写，能力由主进程给**。

### npm start：见证时刻

```bash
npm start
```

一个 800×600 的窗口弹出来了。停一秒，想想刚才发生了什么：Electron 启动了主进程（Node），主进程在 `ready` 后创建窗口，窗口里的渲染进程加载了你的 HTML——[第 04 章](/part1-background/04-process-model)那张进程全景图，此刻在你屏幕上活了。

::: pitfall
**`npm start` 报 `Unable to find Electron app at .../index.js`？** 十有八九是 `main` 字段没改：`npm init -y` 默认指到 `index.js`，而你的入口文件叫 `main.js`。Electron 严格按 `main` 字段找入口，找不到就拒绝启动。看到这条报错，第一反应永远是打开 `package.json` 检查 `main`。
:::

## 第一次困惑：页面里为什么不能用 require

窗口有了，你想给它加点逻辑——比如读个本地文件。凭着主进程的经验，你在 `index.html` 里写下：

```html
<script>
  const fs = require('node:fs')  // ✗ 页面里没有 require 这回事
</script>
```

保存、刷新，页面一片死寂。错误其实已经抛了，只是你还看不见——临时在 `main.js` 的 `createWindow` 里加一行 `win.webContents.openDevTools()`（下一节细讲），刷新后 Console 里躺着：`Uncaught ReferenceError: require is not defined`。

这不是 bug，是设计。你的 HTML 跑在**渲染进程**里——一个被默认配置锁死的纯 Chromium 页面。Electron 34+ 的三个出厂默认值共同决定了「页面即浏览器」：

| 默认值 | 始于 | 对页面意味着 |
| --- | --- | --- |
| `nodeIntegration: false` | Electron 5 | 页面 JS 里没有 `require`、`process`、`fs`——Node 能力为零 |
| `contextIsolation: true` | Electron 12 | 页面 JS 和 preload 脚本处于两个隔离的世界，互相摸不到全局对象 |
| `sandbox: true` | Electron 20 | 渲染进程被操作系统级沙箱包裹，连逃逸的念头都该断掉 |

为什么这么绝情？因为页面的天职就是执行「别人写的代码」——一旦被注入恶意脚本（XSS、投毒的依赖），一个开着 Node 的页面等于把用户磁盘的钥匙递给攻击者。所以现代 Electron 的铁律是：**页面保持纯浏览器，需要系统能力时走一座受控的桥**。桥的名字叫 preload，下一节就修它——这一节你只需要记住结论：页面里不能用 `require` 不是你的错，是所有新人必撞的第一堵墙，而墙上官方给你留了门。

完整的机制（三个默认值各自的防线、桥为什么安全）是[第 10 章·安全模型](/part2-core/10-security)的主线；桥上跑什么、怎么跑是[第 09 章·IPC 通信](/part2-core/09-ipc)的主线。此处不展开。

## 第一次 IPC：让按钮调起系统对话框

需求升级：页面上放一个按钮，点了弹出系统的「选择文件」对话框。对话框是操作系统能力，只能在主进程调；按钮在页面上，只能渲染进程响应——这道题的唯一解法就是 IPC。改三个文件：

**第一处：`main.js` 顶部解构加上 `ipcMain` 和 `dialog`，并在 `whenReady` 之前注册处理函数：**

```js
const { app, BrowserWindow, ipcMain, dialog } = require('electron')

// 注册通道 'dialog:chooseFile' 的处理端：渲染进程 invoke 它，这里应答
ipcMain.handle('dialog:chooseFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'webp'] }]
  })
  // 返回值会变成渲染进程那头 await 的结果
  return canceled ? null : filePaths[0]
})
```

**第二处：`main.js` 的 `createWindow` 里挂上桥（preload）**，并新建 `preload.js`：

```js
// main.js 里 BrowserWindow 的参数改成：
const win = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js')  // __dirname = main.js 所在目录
  }
})
// main.js 顶部记得：const path = require('node:path')
```

```js
// preload.js —— 桥：跑在渲染进程里，但站在隔离世界的另一侧
const { contextBridge, ipcRenderer } = require('electron')

// 把一个白名单接口挂到 window.electronAPI 上，页面里即可调用
contextBridge.exposeInMainWorld('electronAPI', {
  chooseFile: () => ipcRenderer.invoke('dialog:chooseFile')
})
```

**第三处：`index.html` 加上按钮和调用：**

```html
<button id="pick">选择一张图片</button>
<p id="result">还没有选择文件</p>
<script>
  document.getElementById('pick').addEventListener('click', async () => {
    // 页面里不碰 ipcRenderer，只碰 preload 暴露的白名单接口
    const file = await window.electronAPI.chooseFile()
    if (file) document.getElementById('result').textContent = file
  })
</script>
```

重启应用，点按钮——系统对话框弹出，选中后路径显示在页面上。停一秒，看数据走完的完整旅程：**页面点击 → preload 转发（`invoke`）→ 主进程处理（`handle`）→ 操作系统对话框 → 结果原路返回 → 页面更新**。这条 `invoke / handle` 通道是 Electron 开发中 90% 的通信形态，你刚刚亲手跑通的是这个框架最核心的机制——后面所有章节的系统能力，全部踩在这座桥上。

## 第一个坑：改了代码为什么不生效

接下来的某一天，你一定会遇到这个场景：改了 `main.js`，疯狂刷新页面，毫无变化，开始怀疑人生。此刻请背下这张表：

| 你改了什么 | 怎么生效 | 为什么 |
| --- | --- | --- |
| `index.html`、页面里的 JS/CSS | 刷新（macOS `Cmd+R`，Windows/Linux `Ctrl+R`） | 渲染进程重新加载页面 |
| `preload.js` | 先刷新试试；行为诡异就重启 | preload 随页面加载执行，但个别情况有缓存怪癖 |
| `main.js`、主进程用到的任何文件 | **重启应用**（`npm start` 重跑） | 主进程代码在启动时一次性加载进内存，之后常驻 |

这就是双进程的**代码热边界**：渲染层是「网页思维」——刷新即新；主进程是「服务进程思维」——启动即定格。你之所以疯狂刷新没反应，是因为改的东西根本不在渲染进程里。新人期判断口诀就一条：**改之前先问「这行代码属于哪个进程」**——它决定你该刷新还是重启，更决定你该用哪个进程的 API（页面里永远没有 `dialog`，主进程里永远没有 `document`）。

顺带说明：刷新快捷键来自 Electron 的默认菜单。一旦你设置了自定义应用菜单（[第 11 章](/part2-core/11-system)），默认菜单连同这些快捷键一起消失，要靠 `role: 'reload'` 自己加回来。

## 第一个调试：打开 DevTools 的三种方式

上面你已经被迫用过了。这里给出完整版：

```js
// 方式一：代码调用（最可控）——开发期常驻，打包后自动关闭
if (!app.isPackaged) {
  win.webContents.openDevTools({ mode: 'detach' })  // detach = 独立窗口，不挤占页面
}
```

- **方式二：快捷键**。macOS `Cmd+Option+I`，Windows/Linux `F12` 或 `Ctrl+Shift+I`。它由默认菜单提供，同样随自定义菜单一起消失。
- **方式三：右键「检查元素」**。默认没有，要自己做：监听页面 `contextmenu` 事件 → IPC 通知主进程 → `webContents.inspectElement(x, y)` 弹出面板。完整做法就是 [04 号用例](/examples/04-context-menu/)的改造题。

三者的分工：方式一是日常（打开即有），方式二是临时（用户环境、自己的电脑），方式三是给用户报障时的排查入口（生产应用常保留一个隐藏入口）。渲染层的第一现场永远是 DevTools 的 Console——养成「页面行为不对先看 Console」的条件反射，能省掉一半的玄学调试。主进程的调试（断点、日志）是另一套工具，见[第 16 章·调试体系](/part3-engineering/16-debugging)。

## 你现在拥有了什么

三十分钟前你只有一张进程模型图，现在你拥有：

1. 一个能跑的最小应用——三件套齐整，双击图标即可运行的雏形；
2. 一次完整的 IPC 体验——`invoke / handle` + `contextBridge`，后面所有系统能力都是它的变奏；
3. 一条进程直觉——每行代码写下去之前，你开始知道它活在哪、错了去哪查。

这已经足够支撑你走完第二部分剩下的路，每一章都是把今天某个「点到为止」展开成完整能力：

| 章节 | 把今天的什么展开 |
| --- | --- |
| [07 · 窗口体系](/part2-core/07-windows) | 那个 800×600 的窗口：多窗口、防白屏、状态记忆 |
| [08 · 截屏与屏幕捕获](/part2-core/08-screenshot) | 页面截图与全屏采集的三条路径 |
| [09 · IPC 通信](/part2-core/09-ipc) | 今天那座桥的完整形态：三种模式与生产级工具箱 |
| [10 · 安全模型](/part2-core/10-security) | 三个默认值背后的完整防线与攻击者视角 |
| [11 · 系统能力](/part2-core/11-system) | 对话框之外：菜单、托盘、通知、快捷键、协议 |
| [12-14 · 存储与嵌入](/part2-core/12-storage) | 数据放哪、配置怎么管、别人的网页怎么嵌 |

不想按顺序走？[Examples 用例集](/examples/)里 12 个递进用例，每个都是「复制三件套 → `npm install electron` → `npm start`」就能跑的完整小项目。

::: exp
新人期最值得养成的三个习惯，全部来自真实踩坑的沉淀。**第一，改任何代码前先想进程**——它决定刷新还是重启，更决定这行 API 到底存不存在；主进程与渲染进程的 API 不通用，是 Electron 与纯前端开发最大的分水岭。**第二，DevTools 常开**——渲染层九成的问题 Console 里明明白白写着，看不到错误就猜，是新手走弯路的第一大来源；配合方式一的 `!app.isPackaged`，让开发期默认打开。**第三，每学一个新 API，先查它属于哪个进程**——官方文档每个 API 页顶部都标着 `Process: Main` 或 `Process: Renderer`，这一眼能帮你避免「在页面里调 `dialog` 调到天荒地老」式的死胡同。
:::

## 延伸阅读

- [官方入门教程：你的第一个应用（本章的官方对照版）](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app)
- [安装指南（镜像、代理、离线下载的官方说明）](https://www.electronjs.org/docs/latest/tutorial/installation)
- [上下文隔离教程（页面里为什么没有 require 的官方解释）](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [IPC 教程（invoke / handle 的官方完整版）](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [进程模型（回顾本章每一步落在哪个进程）](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [dialog API 文档（本章用到的系统对话框）](https://www.electronjs.org/docs/latest/api/dialog)
