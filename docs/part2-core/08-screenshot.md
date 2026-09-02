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

## 三、macOS 屏幕权限：最容易翻车的一环

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

## 四、区域截图交互：选择框的实现骨架

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

## 五、路径三：原生采集（衔接 RTC）

帧率敏感场景（游戏内截屏直播、高频录屏）下，JS 层 `getUserMedia` 的延迟与 CPU 开销成为瓶颈——生产方案是原生层直接接系统采集 API（Windows DXGI Desktop Duplication、macOS ScreenCaptureKit），帧数据不过 JS 或最小化过桥。集成模式与 SDK 进程放置见[音视频与 RTC](/part4-advanced/26-av-rtc)与[原生集成](/part4-advanced/25-sdk-integration)。

## 延伸阅读

- [desktopCapturer API](https://www.electronjs.org/docs/latest/api/desktop-capturer) —— 源枚举官方文档
- [webContents.capturePage](https://www.electronjs.org/docs/latest/api/web-contents) —— 应用内截屏
- [systemPreferences](https://www.electronjs.org/docs/latest/api/system-preferences) —— macOS 媒体权限
- [官方屏幕采集示例](https://www.electronjs.org/docs/latest/tutorial/screenshots)（Screenshots 教程页，WebFetch 可验证）
- [Chrome 屏幕采集安全要求](https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins/) —— 安全上下文策略的根源
