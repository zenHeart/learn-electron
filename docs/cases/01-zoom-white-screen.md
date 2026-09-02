# 案例 1：缩放持久化白屏——窗口内容突然变小

> **现象 → 诊断 → 根因 → 修复 → 预防** 五段式。本案例展示「Chromium 持久化状态如何反过来咬应用一口」。

## 现象

用户反馈：应用的某个子窗口内容突然变得极小（字体不可读），**重启应用也无法恢复**。截图显示内容整体缩小到 20%~50%。

## 诊断

1. 在故障窗口打开 DevTools，执行：

   ```js
   window.devicePixelRatio
   // 返回 0.2 ~ 0.5 —— 正常应 ≥ 1，说明页面被异常缩放
   ```

2. 找到 Chromium 的用户偏好文件（`userData` 目录下的 `Preferences`），检查 `per_host_host_zoom_levels` 字段：

   ```json
   { "per_host_zoom_levels": { "1234567890": { "about:blank": -21.5 } } }
   ```

   缩放级别 `-21.5`（每级 ≈ ±10%~-15%，对应 0.2x 左右）被持久化记住了。

3. **可复现路径**：手动往 `Preferences` 写入这个字段再启动，故障稳定重现——确认因果关系。

## 根因

两个机制叠加：

1. **触发**：系统分辨率/DPI 变化时，窗口内容被系统缩放，Chromium 把「缩放级别」按 host 记录下来；
2. **持久化**：Chromium 的缩放状态会**跨重启保存**（记住用户的 Ctrl+= / Ctrl+- 操作是同一机制）——异常值因此固化，重启不自愈。

子窗口加载的是 `about:blank` 或本地页面这类「无固定 host」的内容时，缩放挂在特殊键上，用户界面几乎无法用常规方式（Ctrl+0 重置）触达。

## 修复

- 用户侧急救：删除 `Preferences` 中的 `per_host_zoom_levels` 异常项，或直接删整个 `Preferences` 文件（会重置全部 UI 状态，最后手段）。
- 代码侧根治（任选其一）：

  ```js
  // 方案 A：进程序号级锁定缩放（敏感窗口）
  win.webContents.setZoomFactor(1)

  // 方案 B：监听缩放变化强制回正
  win.webContents.on('zoom-changed', (e, dir) => {
    // 记录异常缩放并告警 + 恢复
  })

  // 方案 C：为固定页面设置固定缩放限制
  win.webContents.setVisualZoomLevelLimits(1, 1)   // 触控缩放同理锁定
  ```

## 预防

- 加载本地内容/受控内容的窗口，启动时显式 `setZoomFactor(1)`。
- 监控埋点：定期上报各窗口 `devicePixelRatio`，出现 <1 的值即告警——这类问题用户通常只会截图抱怨「字太小」，不会说「devicePixelRatio 异常」。
- 面试/复盘要点：**Electron 的 userData 目录里不只有你的数据，还有 Chromium 的整套用户偏好**（缩放、字典、缓存策略）——它们是「会反过来影响渲染」的存量状态，排查 UI 异常时永远是必查项。
