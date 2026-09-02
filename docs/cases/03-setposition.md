# 案例 3：setPosition / setBounds 失效——分辨率变化后窗口「不听话」

## 现象

应用在窗口显示前调用 `setPosition` / `setBounds` 精确定位，用户反馈：**切换分辨率（或外接显示器、改 DPI 缩放）后，定位偶尔偏移或不生效**。

## 诊断

1. 在定位失败的机器上打印 `screen.getDisplayMatching(win.getBounds())` 与窗口实际 bounds 对比——发现**读取到的窗口高度与真实值不符**；
2. 复现路径明确：分辨率/DPI 变化 → Windows 返回 stale 的窗口尺寸 → 基于错误高度计算的坐标全部偏移。

## 根因

Windows 上修改分辨率后，已有窗口的尺寸信息存在一个「陈旧窗口」：应用按旧坐标系计算新位置，`setBounds` 又被系统按新 DPI 换算——两次换算叠加产生偏移。相关上游 issue：[electron#9477](https://github.com/electron/electron/issues/9477)。

## 修复

每次**显示窗口前重置一次尺寸**，再定位（两步走，把「改尺寸」和「定位」解耦）：

```js
function placeWindow(win, x, y, w, h) {
  win.setSize(w, h)          // 先重置尺寸，拿到干净基准
  win.setPosition(x, y)      // 再定位
}
```

多屏切换时再加一次「focus 后修正」（部分平台 setBounds 在窗口未激活时静默失败）：

```js
win.once('restore', () => {
  win.once('focus', () => win.setBounds(target), { once: true })
  setTimeout(() => win.setBounds(target), 1000)  // 1 秒兜底，防 focus 不来
})
```

## 预防

- 涉及窗口定位的代码全部封装到唯一工具函数，禁止业务代码裸调 `setBounds`。
- QA 用例固定包含「改分辨率 / 拔插显示器 / 改 DPI 150%」三个场景过一遍窗口布局。
- 关联知识：[窗口管理](/part2-core/07-windows) 的坐标系与多屏一节。
