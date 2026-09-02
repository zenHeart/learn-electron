# 截屏与屏幕捕获

> **一句话本质**：「截什么」决定技术路径——截自己的窗口用 `capturePage`（零权限）、截整屏/其他应用用 `desktopCapturer`（macOS 要屏幕录制权限）、帧级低延迟采集走原生 SDK；三条路径的能力与权限成本完全不同。

读完本章你会获得：三条截屏路径的选型判断、macOS 屏幕权限的完整处理链、区域选择交互的实现骨架、图片数据的正确传输方式，以及多屏/DPI 的实战处理。

## 心智模型：三条路径一张表

| 路径 | API | 能截 | 权限 | 典型场景 |
|---|---|---|---|---|
| 应用内截屏 | `webContents.capturePage()` | 本应用任意窗口 | 无 | 分享卡片、页面快照、崩溃留证 |
| 屏幕捕获 | `desktopCapturer` + `getUserMedia` | 整屏/指定窗口（含其他应用） | macOS 屏幕录制授权 | 屏幕共享、录屏、区域截图工具 |
| 原生 SDK | C++/系统 API（如 Windows DXGI/GDI） | 帧级屏幕流 | 视实现 | 高帧率采集、游戏画面、RTC 推流 |

决策顺序：能用路径一就不动权限；用户明确要「屏幕/别的窗口」才走路径二；帧率/延迟要求进入采集管线级别（RTC、游戏）才考虑路径三（见[音视频章](/part4-advanced/26-av-rtc)）。

## 一、路径一：应用内截屏（capturePage）

```js
// 主进程：给指定窗口拍快照
async function snapshot(win) {
  const image = await win.webContents.capturePage()   // NativeImage
  return image.toPNG()                                 // Buffer，可直接存盘
}
// 指定区域：capturePage({ x, y, width, height }) —— 坐标为页面 CSS 像素
```

特点：无权限、无用户感知、返回 `NativeImage`（可 `toPNG()/toJPEG(quality)/toDataURL()/resize()`）。注意它是**异步渲染**完成后的画面——offscreen 模式下同样可用。

```js
// 组合：截屏 → 保存对话框（IPC 完整链路）
ipcMain.handle('shot:saveSelf', async () => {
  const win = BrowserWindow.getFocusedWindow()
  const buf = (await win.webContents.capturePage()).toPNG()
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: '图片', extensions: ['png'] }],
  })
  if (!canceled) fs.promises.writeFile(filePath, buf)
})
```

## 二、路径二：desktopCapturer 屏幕捕获

### 枚举可采集源

```js
// 渲染进程（或主进程）——列出所有屏幕与窗口
const sources = await desktopCapturer.getSources({
  types: ['screen', 'window'],
  thumbnailSize: { width: 320, height: 180 },   // 缩略图给用户选
})
// sources[i].id / .name / .display_id / .thumbnail(NativeImage) / .appIcon
```

### 取流（getUserMedia）

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: sources[0].id,    // 选中的源
      maxWidth: 3840, maxHeight: 2160,       // 采集上限
    },
  },
})
videoEl.srcObject = stream   // <video> 预览 / canvas 抓帧 / WebRTC 推流
```

::: pitfall 坑位警报
`getUserMedia` 只在**安全上下文**可用：`https://`、`file://` 或自定义 `app://` 协议（且注册时声明 `standard: true, secure: true`）。如果你的页面是 `http://localhost` 之外的普通 http 远程页面，`getUserMedia` 直接 undefined——这是 Chromium 的安全策略，不是 Electron 的 bug。解法：自定义协议加载本地入口页（见[系统能力章](/part2-core/11-system)），或 `session.setPermissionRequestHandler` 放行的前提下走 https。
:::

### 从视频流抓一张静态图

```js
// 视频流 → 指定时刻的一帧
const track = stream.getVideoTracks()[0]
const imageCapture = new ImageCapture(track)
const bitmap = await imageCapture.grabFrame()      // ImageBitmap
const canvas = document.createElement('canvas')
canvas.getContext('2d').drawImage(bitmap, 0, 0)
const dataUrl = canvas.toDataURL('image/png')
track.stop()   // 截完即停，别占着采集管线
```

## 三、生产级方案解剖：整屏快照 + Web 编辑器

真实的截屏工具（截图带标注、取色、马赛克的完整产品）怎么架构？以下解剖一个生产 SDK 的完整设计（已泛化），它验证了一条重要结论：**采集在主进程，编辑在 Web 层**。

### 先看选型：三种方案的取舍

| 方案 | 做法 | 代价 | 适用 |
|---|---|---|---|
| 唤起系统截屏 | 调系统自带截图 | UI 不可定制、无标注能力 | 能接受原生体验的简单需求 |
| 原生模块截屏 | C++/Rust `.node` 直接调系统 API | 开发成本高、跨平台矩阵维护重 | 需要实时帧/跨屏连续操作（大厂 IM 常用） |
| **渲染进程截屏**（本方案） | 主进程截整屏快照 → Web 编辑器框选/标注/导出 | 快照非实时；一次只处理一个屏 | 绝大多数「截图+标注」场景 |

「快照非实时、单屏操作」这两个限制对消息截图类场景完全无感，换来的是**编辑器整套在 Web 层开发，甚至能脱离 Electron 在纯浏览器里调试**——用场景约束换实现成本的教科书案例。

### 三层分工与数据流

```text
主进程（采集 + 窗口 + 系统能力）
  ├─ desktopCapturer 整屏快照 → dataURL
  ├─ 透明全屏窗（预创建隐藏）+ 常驻编辑器视图
  ├─ 剪贴板写入 / 保存对话框 / 全局快捷键（仅激活期占用）
preload（contextBridge 白名单）
  └─ ready / ok / save / cancel / on / off 六个方法
Web 编辑器（React/Vue 均可）
  └─ 背景图+遮罩 → 框选 → 矩形/箭头/画笔/文字/马赛克 → canvas 合成 PNG
```

**图片的跨程往返**（方向不同、形态不同）：

```js
// 去程（主→编辑器）：dataURL 字符串直接推
view.webContents.send('capture', display, imageUrl)

// 回程（编辑器→主）：Blob → ArrayBuffer → Buffer
// preload：
ok: (arrayBuffer, data) => ipcRenderer.send('ok', Buffer.from(arrayBuffer), data)
// 主进程：
ipcMain.on('ok', (_e, buffer, { bounds, display }) => {
  clipboard.writeImage(nativeImage.createFromBuffer(buffer))   // 写剪贴板
})
```

### 取流细节：三处必踩的坑一次讲清

```js
// 1. thumbnailSize 必须乘 scaleFactor——不传默认 150×150，得到的是模糊缩略图
const sources = await desktopCapturer.getSources({
  types: ['screen'],
  thumbnailSize: {
    width: display.width * display.scaleFactor,    // 逻辑像素 × 缩放比 = 物理像素
    height: display.height * display.scaleFactor,
  },
})
const imageUrl = sources[0].thumbnail.toDataURL()  // 快照即成品，无需 getUserMedia

// 2. 显示器定位：以光标所在屏为准（用户想截哪块屏，鼠标先移过去）
const point = screen.getCursorScreenPoint()
const { id, bounds, scaleFactor } = screen.getDisplayNearestPoint(point)

// 3. bounds 一律 Math.floor——高分屏下 DIP 坐标可能是小数，
//    直接 setBounds 会产生半像素模糊
```

source 与 display 的匹配在 Linux 上有特判：`display_id` 可能为空，退化用 `source.id` 的 `screen:{id}:` 前缀匹配；单屏时直接取第一个。

### 防御式 IPC：握手与超时竞速

主进程与编辑器视图是异步加载关系，直接发消息会丢：

```js
// 握手：编辑器加载完成才 resolve，后续操作全部 await 它
this.isReady = new Promise(resolve => {
  ipcMain.once('ready', () => resolve())
})
// 触发截屏时，取流与握手并行——两件事都好了才显示窗口（首屏体验关键）
const [imageUrl] = await Promise.all([this.capture(display), this.isReady])

// 重置选区：IPC 回执与 100ms 超时竞速——渲染层即使卡死也不阻塞主进程
await Promise.race([
  new Promise(resolve => setTimeout(resolve, 100)),
  new Promise(resolve => ipcMain.once('reset-done', resolve)),
])
```

### 跨平台窗口参数：每行注释都是一个真实 bug

承载编辑器的透明全屏窗，生产级参数防御（直接抄走可省一轮踩坑）：

```js
new BrowserWindow({
  x: display.x, y: display.y, width: display.width, height: display.height,
  type: { darwin: 'panel', win32: 'toolbar', linux: undefined }[process.platform],
  // linux 的 type 必须为 undefined，否则部分系统不触发 focus 事件
  frame: false, transparent: true,
  focusable: true,   // 必须为 true——否则 Esc 不响应、输入框不能输入
  skipTaskbar: true, alwaysOnTop: true,
  fullscreen: false, // linux 必须为 false 才能全屏置顶；mac 为 false 防程序坞不恢复
  fullscreenable: false,  // mac 设 true 会崩溃
  hasShadow: false, backgroundColor: '#00000000',
  acceptFirstMouse: true, // mac：点击即激活并收到事件
  show: false,            // 预创建但隐藏——快捷键按下时窗口已就绪
})
// 结束顺序敏感：先 setAlwaysOnTop(false) + setKiosk(false)，再 unmaximize 才有效
```

::: exp 实战经验（截屏 SDK 的三个工程设计）
①**预创建隐藏窗口 + 常驻编辑器视图**：窗口与编辑器 JS 上下文、图片解码器全程热着，快捷键到可交互接近零延迟——结束后只移除视图不销毁；②**全局快捷键只在激活期占用**：`startCapture` 动态注册 Esc、`endCapture` 注销，并先判 `$win.isFocused()`——系统级快捷键是稀缺资源，不要常驻；③**失败绝不带崩主进程**：整个触发链 try/catch + 埋点钩子（trigger/ok/cancel/save/error 全打点），截屏挂了应用不能挂。
:::

## 四、macOS 屏幕权限：最容易翻车的一环

macOS 10.15+ 截取屏幕必须获得「屏幕录制」权限——**没有弹窗主动请求的 API**，需要引导用户去系统设置开启：

```js
const { systemPreferences } = require('electron')

function checkScreenPermission() {
  // macOS 专有；Windows/Linux 直接返回 'granted'
  const status = systemPreferences.getMediaAccessStatus('screen')
  // 'not-determined' | 'denied' | 'granted' | 'restricted' | 'unknown'
  if (status !== 'granted') {
    dialog.showMessageBox({
      type: 'info',
      message: '需要屏幕录制权限',
      detail: '请在 系统设置 → 隐私与安全性 → 屏幕录制 中勾选本应用',
      buttons: ['打开系统设置', '取消'],
    }).then(({ response }) => {
      if (response === 0) shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture')
    })
    return false
  }
  return true
}
```

关键行为细节：

- 用户**在系统设置里勾选授权后，应用必须重启**才生效（系统层面重新授权）——UI 上要明确提示，否则用户以为没生效反复折腾；
- `Info.plist` 里 `NSDesktopFolderUsageDescription` 等声明不影响屏幕录制（那是文件域），屏幕录制只看系统设置勾选；
- 摄像头/麦克风是另一套：`systemPreferences.askForMediaAccess('camera')` **有**主动请求 API（首次弹窗），且同样要求打包后的应用在 Info.plist 声明用途文案（用 `electron-builder` 的 `extendInfo` 配置），否则崩溃。

| 能力 | macOS | Windows | Linux(X11) |
|---|---|---|---|
| 截自己窗口 | 无 | 无 | 无 |
| 截屏幕 | 屏幕录制权限（设置页勾选，重启生效） | 无 | 无 |
| 摄像头 | askForMediaAccess + Info.plist 声明 | 无系统级 | 视桌面环境 |
| 音频环回（录系统声） | 不支持（需虚拟音频驱动，如 BlackHole） | 默认采集（`chromeMediaSource: 'desktop'` 的 audio） | PulseAudio monitor |

## 五、区域截图交互：选择框的实现骨架

做一个「截图工具」（用户拖框选区域）的骨架——透明全屏窗 + 蒙层 + 框选，多屏时每屏一窗：

```js
// 主进程：为每个显示器创建一个选择窗
function startRegionCapture(onDone) {
  const wins = screen.getAllDisplays().map((display) => {
    const { x, y, width, height } = display.bounds
    const win = new BrowserWindow({
      x, y, width, height,
      fullscreen: true,                    // mac 用 fullscreen 覆盖菜单栏遮挡
      frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
      webPreferences: { preload: regionPreload },
    })
    win.loadFile('region-picker.html')     // 蒙层 + 框选 UI（pointer-events 控制）
    return win
  })
  // 渲染层框选结束 → IPC 回传 { displayId, rect } → 主进程 desktopCapturer 截整屏
  // → 按 rect 裁剪（sharp 或 NativeImage.resize/crop）→ 关闭全部选择窗 → 回调
}
```

裁剪注意 DPI：选择窗内的 CSS 像素 ≠ 采集图像的物理像素，按 `display.scaleFactor` 换算裁剪矩形，否则高分屏上截出的区域错位。

::: exp 实战经验
①**采集上限别拉满**：`maxWidth/maxHeight` 按「实际用途 +1 档」设置（预览 1080p 就设 1920）——4K 全量采集的解码内存与卡顿在低配机上非常明显；②**截屏结果的传输**：主进程 → 渲染层的图片数据传 `Buffer`（结构化克隆零成本转移）而不是 base64 字符串——base64 让体积膨胀 33% 且多一次编解码；③**采集会话即用即停**：`getUserMedia` 的 video track 持续占摄像头/合成管线，截图工具取完帧立刻 `track.stop()`，否则 GPU 内存持续增长（正是[性能章](/part3-engineering/18-performance)讲的纹理驻留问题）。
:::

::: pitfall 坑位警报
三个高频坑：
1. **缩略图当正图用**——`getSources` 的 `thumbnail` 是按你给的 `thumbnailSize` 缩放过的，要原图必须走 getUserMedia 取流抓帧；
2. **窗口截屏的 `window` 源在部分 Linux 桌面返回黑块**——X11 窗口采集依赖合成器配合，Wayland 更是受限，Linux 上的截屏方案必须实测目标桌面环境；
3. **Electron 版本升级后 sources 的 id 格式变化**——`window:xx:0` / `screen:xx:0` 前缀是 Chromium 内部实现，别持久化解析它，每次实时枚举。
:::

## 六、路径三：原生采集（衔接 RTC）

帧率敏感场景（游戏内截屏直播、高频录屏）下，JS 层 `getUserMedia` 的延迟与 CPU 开销成为瓶颈——生产方案是原生层直接接系统采集 API（Windows DXGI Desktop Duplication、macOS ScreenCaptureKit），帧数据不过 JS 或最小化过桥。集成模式与 SDK 进程放置见[音视频与 RTC](/part4-advanced/26-av-rtc)与[原生集成](/part4-advanced/25-sdk-integration)。

## 延伸阅读

- [desktopCapturer API](https://www.electronjs.org/docs/latest/api/desktop-capturer) —— 源枚举官方文档
- [webContents.capturePage](https://www.electronjs.org/docs/latest/api/web-contents) —— 应用内截屏
- [systemPreferences](https://www.electronjs.org/docs/latest/api/system-preferences) —— macOS 媒体权限
- [官方屏幕采集示例](https://www.electronjs.org/docs/latest/tutorial/screenshots)（Screenshots 教程页，WebFetch 可验证）
- [Chrome 屏幕采集安全要求](https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins/) —— 安全上下文策略的根源
