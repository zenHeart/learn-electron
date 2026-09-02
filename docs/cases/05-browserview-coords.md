# 案例 5：坐标系偏移——BrowserView/WebContentsView 与窗口坐标不一致

## 现象

用 `WebContentsView`（旧代码用 `BrowserView`，坐标系行为相同）做窗口内的嵌入式区域（如顶部工具条、内嵌页面区），发现设置同样的坐标值，视图位置与预期不符；且 **mac 和 Windows 表现不同**，mac 上还被窗口标题栏遮住一角。

## 诊断

打印两组坐标对照：

```js
const { x: wx, y: wy } = win.getPosition()      // 窗口坐标：相对屏幕左上角
view.setBounds({ x: 10, y: 10, width, height }) // 视图坐标：相对什么？
```

实测结论：

1. **窗口坐标**（`getPosition`/`setPosition`）：原点在**屏幕左上角**；
2. **视图坐标**（`setBounds`）：原点在**窗口内容区左上角**——两套坐标系不通用；
3. **平台差异**：macOS 的窗口可用内容区计算与 Windows 不同——mac 的 `y` 计算是「包含式」的（标题栏/红绿灯按钮占据的区域要算进去），Windows 无此问题。在 mac 上若要让视图从标题栏下沿开始，需要**额外加上自定义标题栏/系统标题栏的高度**补偿。

## 根因

Electron 有三套坐标系：屏幕坐标（窗口定位用）、窗口坐标（视图布局用）、CSS 坐标（页面内部）。文档分散在各 API 页，且历史版本间 `BrowserView` 的参照点有过微调（相关讨论：[electron#35994](https://github.com/electron/electron/issues/35994)）。

## 修复

封装统一的布局工具，把平台差异藏进去：

```js
const TITLE_BAR = { darwin: 28, win32: 0 }[process.platform] ?? 0

function layoutBelowTitleBar(view, win, margin = 0) {
  const [w, h] = win.getContentSize()   // 注意用内容区尺寸，不是窗口外框尺寸
  view.setBounds({
    x: margin,
    y: TITLE_BAR + margin,
    width: w - margin * 2,
    height: h - TITLE_BAR - margin * 2
  })
}
```

配套：窗口 resize 时重新布局（`win.on('resize', ...)`），并记得在视图销毁时解绑监听。

## 预防

- 所有视图布局走同一个工具函数；`getPosition`（窗口）与 `setBounds`（视图）永远不要混用同一组数值。
- 三平台各留一台测试机（或至少 CI 截图对比）跑布局用例。
- 关联知识：[嵌入 Web 内容](/part2-core/14-webview) 的 WebContentsView 一节。
