# 嵌入 Web 内容

> **一句话本质**：三种嵌入方式（`iframe` / `<webview>` 标签 / `WebContentsView`）是一条「**隔离度 vs 控制力**」的取舍光谱——iframe 隔离于同源策略内、零主进程参与；WebContentsView 独立进程、主进程完全控制；`<webview>` 居中但官方标记实验性。

读完本篇你能获得：三种方式的选型对比表、WebContentsView 完整布局示例（含窗口 resize 联动与平台标题栏补偿）、嵌入安全三件套、离屏渲染与 DevTools 扩展的入门代码。

## 心智模型：一条取舍光谱

```text
控制力（主进程）   ◄──────────────────────────────►   零主进程参与
隔离度（独立进程）  ◄──────────────────────────────►   同源同一进程

  WebContentsView          <webview> 标签            iframe
  ├─ 独立渲染进程           ├─ 独立渲染进程            ├─ 与宿主同进程
  ├─ 主进程全权控制          ├─ 声明式、半受控          ├─ 只受同源策略约束
  ├─ 原子级布局/导航拦截      ├─ 官方标记 experimental   ├─ 无法拦截导航
  └─ Electron 30+ 推荐       └─ 默认禁用                └─ 纯 Web 方案
```

| 维度 | iframe | `<webview>` 标签 | WebContentsView |
| --- | --- | --- | --- |
| 进程模型 | 与宿主页面同渲染进程 | 独立渲染进程 | 独立渲染进程 |
| 主进程参与 | 无 | 部分（事件桥接） | 完全（创建/布局/拦截全在主进程） |
| 布局方式 | CSS 文档流 | CSS 文档流（DOM 元素） | `setBounds` 像素级控制 |
| 导航/弹窗拦截 | 做不到 | 事件监听 | `will-navigate` / `setWindowOpenHandler` 全拦 |
| 开关状态 | Electron 30 起不默认支持非沙箱内容 | 需显式 `webviewTag: true`，官方标记实验性 | Electron 30+ 推荐，替代已废弃的 BrowserView |
| 适用场景 | 嵌自己网站的静态块 | 简单第三方页面嵌入 | 一切生产级嵌入需求 |

结论先行：**生产项目无脑选 WebContentsView**；iframe 只在嵌自己同源内容时可用；`<webview>` 不建议新项目采用（理由见坑位警报）。

## iframe：最简单也最受限

```html
<!-- 只适合嵌入你自己控制的同源内容 -->
<iframe src="./panel.html" style="width: 100%; height: 400px"></iframe>
```

```js
// 宿主窗口的 webPreferences 必须维持沙箱默认值，
// 沙箱模式下 Electron 30+ 的 iframe 只允许加载本地与已授权内容
```

它拿不到任何 Electron 能力：不能拦截跳转、不能感知内部导航、跨域内容直接被浏览器策略挡掉。把它当成纯 Web 组件用，别指望桌面级控制。

## WebContentsView：现代推荐方案

`WebContentsView` 是 Electron 30+ 引入、用于替代（已废弃的）`BrowserView` 的官方 API，与 `BaseWindow`（纯窗口壳）组合是当前标准窗口方案：

```js
const { app, BaseWindow, WebContentsView } = require('electron')
const path = require('node:path')

// 跨平台可用区补偿：嵌入区必须避开顶部工具条，
// mac 的红绿灯按钮区包含在窗口内、Windows 无系统标题栏时也要给自绘工具条留位
const TOP_BAR = process.platform === 'darwin' ? 28 : 32

let win, toolbar, embed

function createWindow() {
  win = new BaseWindow({ width: 1000, height: 660 })

  // 顶部工具条：加载本地 UI（自己的代码，带 preload）
  toolbar = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  })
  toolbar.webContents.loadFile(path.join(__dirname, 'renderer', 'toolbar.html'))
  win.contentView.addChildView(toolbar)

  // 主嵌入区：加载第三方页面（不可信内容，独立会话 + 最小权限）
  embed = new WebContentsView({
    webPreferences: {
      sandbox: true,
      partition: 'embed-no-trusted' // 独立会话：Cookie/存储与主应用隔离
    }
  })
  win.contentView.addChildView(embed)

  attachEmbedPolicy(embed)
  layout()
  win.on('resize', layout) // 窗口尺寸变化时重新布局，否则嵌入区不跟随

  embed.webContents.loadURL('https://trusted.example.com')
}

// 统一布局函数：所有尺寸计算只在这一个地方
function layout() {
  const [w, h] = win.getContentSize() // 内容区尺寸（不含系统边框）
  toolbar.setBounds({ x: 0, y: 0, width: w, height: TOP_BAR })
  embed.setBounds({ x: 0, y: TOP_BAR, width: w, height: h - TOP_BAR })
}

// 嵌入安全三件套（见下节详解）
function attachEmbedPolicy(view) {
  const wc = view.webContents
  // 1. 弹窗全拒：嵌入内容无权再开新窗口
  wc.setWindowOpenHandler(() => ({ action: 'deny' }))
  // 2. 导航拦截：只放行白名单域
  wc.on('will-navigate', (event, url) => {
    if (!ALLOWED_HOSTS.has(new URL(url).host)) event.preventDefault()
  })
}
const ALLOWED_HOSTS = new Set(['trusted.example.com'])

app.whenReady().then(createWindow)
```

理解三个关键点：

- **contentView 是视图树**：`win.contentView.addChildView()` 把 view 挂进窗口，后添加的在上层；`removeChildView` 移除（可复用于"关闭标签页"类交互）。
- **setBounds 是像素级硬边界**：坐标系原点在**窗口内容区左上角，y 轴向下**——Web 开发者习惯的"文档流自动布局"不存在，每个 view 的位置尺寸全部手动计算，所以必须收敛到唯一一个 `layout()` 函数。
- **getContentSize vs getSize**：`getSize` 含系统边框，`getContentSize` 是内容区，布局一律用后者。

## `<webview>` 标签：声明式糖衣，实验性内核

```html
<!-- 需先在宿主窗口 webPreferences 显式开启：webviewTag: true -->
<webview
  src="https://trusted.example.com"
  allowpopups="false"
  style="width: 100%; height: 100%"
></webview>
```

```js
// 宿主页脚本：等待 webview 挂载完成才能拿到完整 API
const webview = document.querySelector('webview')
webview.addEventListener('dom-ready', () => {
  webview.setZoomFactor(1)
})
```

它的卖点是"像写 DOM 一样声明嵌入"，但本质仍是 `WebContentsView` 之上的一层封装，且 API 表面随 Chromium 版本漂移——官方文档至今顶部横着 experimental 警告。老项目存量使用可继续维护，新项目没有理由选它。

## 嵌入安全三件套

嵌入第三方内容时，以下三条是底线组合（上文 WebContentsView 示例已内置）：

```js
function hardenEmbeddedWebContents(wc, allowedHosts) {
  // 1. 弹窗拦截：嵌入内容不得打开新窗口（window.open / target=_blank 全部拒绝）
  wc.setWindowOpenHandler(({ url }) => {
    console.warn('已拦截嵌入内容弹窗：', url)
    return { action: 'deny' }
  })

  // 2. 导航白名单：初始加载之后的一切跳转都过白名单
  //    （防止广告跳转/钓鱼页把嵌入区带走）
  wc.on('will-navigate', (event, url) => {
    if (!allowedHosts.includes(new URL(url).host)) event.preventDefault()
  })

  // 3. 会话隔离：独立 partition，嵌入内容的 Cookie/存储/缓存与主应用分开
  //    （进一步可用非持久分区 persist:false，关闭即清空）
  //    —— 在创建 WebContentsView 时通过 webPreferences.partition 指定
}
```

若确实需要允许 `<webview>` 开弹窗（`allowpopups` 属性），必须同时在其 `setWindowOpenHandler` 里按白名单过滤 URL——两条防线不能只留一条。

## 离屏渲染：不显示窗口的渲染

让 webContents 在不参与屏幕显示的情况下持续出帧，每帧以位图形式交给你：

```js
const view = new WebContentsView({
  webPreferences: { offscreen: true, sandbox: true }
})

view.webContents.on('paint', (event, dirty, image) => {
  // image 是 NativeImage：可 toDataURL()/toBitmap() 导出，
  // 也可以推给别的进程做预览、识别、编码
})
view.webContents.setFrameRate(10) // 降低出帧率，省 CPU
view.webContents.loadURL('https://trusted.example.com')
```

适用场景：页面截图/缩略图生成、后台内容预览、把页面帧转发到别处渲染。**不适合**拿来做常规界面——合成不走 GPU 显示路径，复杂页面帧率上不去。详见[离屏渲染教程](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering)。

## DevTools 扩展加载

开发期把 Vue/React DevTools 装进应用内 DevTools：

```js
// npm i -D electron-devtools-installer
const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer')

app.whenReady().then(async () => {
  try {
    await installExtension(VUEJS_DEVTOOLS)
  } catch (err) {
    console.warn('DevTools 扩展安装失败：', err.message)
  }
  createWindow()
})
```

注意扩展生态正在向 Chrome Manifest V3 迁移，个别扩展在部分 Electron 版本上装不上（与 Chromium 内核版本相关），失败时以静默降级处理，不要阻断启动。

## 实战要点

::: exp
**1. WebContentsView 坐标系与平台可用区补偿。** `setBounds` 的原点相对**窗口内容区左上角、y 轴向下**，这与屏幕坐标（`screen` 系 API）原点在主屏左上角是两套体系，混用必错。布局时按平台补偿顶部：mac 无边框窗含红绿灯按钮区（约 28pt，或按 `trafficLightPosition` 实际值），Windows 自绘标题栏按自己设计稿高度算；一切高度计算收敛进唯一的 `layout()` 函数，`resize` 事件里只调它。坐标系差异的完整拆解见[案例：坐标系偏移](/guide/cases/05-browserview-coords)。

**2. 多标签页架构就用"view 池"。** 每个标签页对应一个 WebContentsView，切换标签 = `addChildView` 目标 + `removeChildView` 其余（或调 `setBounds` 把非激活项移出可视区）。销毁标签记得 `view.webContents.close()` 释放进程，view 对象本身也要解除引用，否则渲染进程泄漏。
:::

## 坑位警报

::: pitfall
**1. `<webview>` 的 API 稳定性是历史包袱。** 官方文档自 2016 年起持续标注 experimental：事件与方法随 Chromium 大版本漂移、部分平台行为不一致、安全隐患修复滞后。新项目选它等于把地基放在官方明示不担保的 API 上——**无脑选 WebContentsView**，功能完全覆盖且由主进程集中管控。

**2. `will-navigate` 只拦"加载后的跳转"，拦不住初始 `loadURL`。** 白名单校验必须同时覆盖两处：创建时对要加载的 URL 先验一次再 `loadURL`，加载后靠 `will-navigate` 拦后续跳转。只装一道防线，第一次加载就能被恶意构造的入口绕过。
:::

## 延伸阅读

- [嵌入 Web 内容教程](https://www.electronjs.org/docs/latest/tutorial/web-embeds) — 官方对三种嵌入方式的对比结论
- [WebContentsView API](https://www.electronjs.org/docs/latest/api/web-contents-view) — 视图创建、addChildView/setBounds 全量 API
- [BaseWindow API](https://www.electronjs.org/docs/latest/api/base-window) — 纯窗口壳与 contentView 视图树
- [Webview Tag API](https://www.electronjs.org/docs/latest/api/webview-tag) — 实验性声明式嵌入的完整说明
- [离屏渲染教程](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering) — paint 事件与帧率控制
