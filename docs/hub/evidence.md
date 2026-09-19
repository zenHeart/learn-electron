# 证据索引 · 每章对应官方权威来源

> 本页是站点所有「讲解 → 证据」的反向索引：**节点 → 引用 → 来源**。任何章节里出现的「官方说」「文档定义」「根据 X.Y.Z 节」都能在此页查到精确来源。来源 URL 均在 2026-09-20 验证可达。

## 第一部分 · 技术背景与认知

| 章节 | 官方权威 | 必读 section |
|---|---|---|
| [01 · Electron 是什么](/part1-background/01-what-is-electron) | [官方文档首页](https://www.electronjs.org/docs/latest) | Introduction |
| [02 · 发展历史](/part1-background/02-history) | [官方 10 周年博客（中）](https://www.electronjs.org/zh/blog/10-years-of-electron) | 全文 |
| [03 · 技术架构剖析](/part1-background/03-architecture) | [官方 Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) | 全文 |
| [04 · 进程模型（核心）](/part1-background/04-process-model) | [官方 Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) · [UtilityProcess API](https://www.electronjs.org/docs/latest/api/utility-process) | 全文 + UtilityProcess API |
| [05 · 应用生命周期](/part1-background/05-lifecycle) | [官方 App API](https://www.electronjs.org/docs/latest/api/app) · [BrowserWindow 事件](https://www.electronjs.org/docs/latest/api/browser-window) | app.on('ready')/('window-all-closed')/('activate') + win.on('ready-to-show')/('closed') |

## 第二部分 · 核心知识体系

| 章节 | 官方权威 | 必读 section |
|---|---|---|
| [06 · 新人第一课](/part2-core/06-first-app) | [官方 Tutorial](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app) | 全文 |
| [07 · 窗口体系](/part2-core/07-windows) | [官方 BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window) · [BaseWindow](https://www.electronjs.org/docs/latest/api/base-window) · [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view) | 全部 options + 实例方法 |
| [08 · 截屏与屏幕捕获](/part2-core/08-screenshot) | [desktopCapturer API](https://www.electronjs.org/docs/latest/api/desktop-capturer) | 全文 |
| [09 · IPC 通信](/part2-core/09-ipc) | [ipcMain](https://www.electronjs.org/docs/latest/api/ipc-main) · [ipcRenderer](https://www.electronjs.org/docs/latest/api/ipc-renderer) · [MessagePorts 教程](https://www.electronjs.org/docs/latest/tutorial/message-ports) | handle/invoke/on + MessageChannelMain |
| [10 · 安全模型](/part2-core/10-security) | [官方 Security 教程](https://www.electronjs.org/docs/latest/tutorial/security) · [contextBridge API](https://www.electronjs.org/docs/latest/api/context-bridge) · [Fuses 教程](https://www.electronjs.org/docs/latest/tutorial/fuses) | 全文 |
| [11 · 系统能力](/part2-core/11-system) | [Menu](https://www.electronjs.org/docs/latest/api/menu) · [Tray](https://www.electronjs.org/docs/latest/api/tray) · [Notification](https://www.electronjs.org/docs/latest/api/notification) · [shell](https://www.electronjs.org/docs/latest/api/shell) · [app.setAsDefaultProtocolClient](https://www.electronjs.org/docs/latest/api/app#appsetasdefaultprotocolclientprotocol) | 各 API 全文 |
| [12 · 存储架构](/part2-core/12-storage) | [Session API](https://www.electronjs.org/docs/latest/api/session) · [app.getPath](https://www.electronjs.org/docs/latest/api/app#appgetpathname) | 全文 |
| [13 · 配置系统](/part2-core/13-config) | [官方 Security - 设置安全](https://www.electronjs.org/docs/latest/tutorial/security#2-handle-session-permission-requests-from-remote-content) · [Protocol API](https://www.electronjs.org/docs/latest/api/protocol) | setPermissionRequestHandler + registerSchemesAsPrivileged |
| [14 · 嵌入 Web 内容](/part2-core/14-webview) | [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view) · [`<webview>` 标签](https://www.electronjs.org/docs/latest/api/webview-tag) | WebContentsView 全文 |

## 第三部分 · 工程体系

| 章节 | 官方权威 | 必读 section |
|---|---|---|
| [15 · 工程脚手架](/part3-engineering/15-scaffold) | [官方 Application Architecture](https://www.electronjs.org/docs/latest/tutorial/application-architecture) | 全文 |
| [16 · 调试体系](/part3-engineering/16-debugging) | [官方 DevTools 教程](https://www.electronjs.org/docs/latest/tutorial/devtools-extension) · [命令行开关](https://www.electronjs.org/docs/latest/api/command-line-switches) · [环境变量](https://www.electronjs.org/docs/latest/api/environment-variables) | 全部 |
| [17 · 测试实践](/part3-engineering/17-testing) | [官方 Testing 教程](https://www.electronjs.org/docs/latest/tutorial/testing) · [Playwright Electron](https://playwright.dev/docs/api/class-electron) | 全文 |
| [18 · 性能优化](/part3-engineering/18-performance) | [官方 Performance 教程](https://www.electronjs.org/docs/latest/tutorial/performance) · [process.getCPUUsage](https://www.electronjs.org/docs/latest/api/process) · [app.getAppMetrics](https://www.electronjs.org/docs/latest/api/app#appgetappmetrics) | 全文 |
| [19 · 打包与分发](/part3-engineering/19-packaging) | [官方 Application Distribution](https://www.electronjs.org/docs/latest/tutorial/application-distribution) · [electron-builder 文档](https://www.electron.build/) · [Electron Forge 文档](https://www.electronforge.io/) | 全文 |
| [20 · 签名与公证](/part3-engineering/20-signing) | [官方 Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing) · [Apple notarytool](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution) · [Microsoft signtool](https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool) | 全文 |
| [21 · 自动更新](/part3-engineering/21-releases-updates) | [electron-updater 文档](https://www.electron.build/auto-update) · [官方 Auto Update 教程](https://www.electronjs.org/docs/latest/tutorial/updates) | 全文 |
| [22 · CI/CD](/part3-engineering/22-cicd) | [官方 Testing on Headless CI](https://www.electronjs.org/docs/latest/tutorial/testing-on-headless-ci) · [GitHub Actions 文档](https://docs.github.com/en/actions) | 全文 |
| [23 · 监控可观测](/part3-engineering/23-observability) | [官方 Crash Reporting](https://www.electronjs.org/docs/latest/tutorial/crash-reports) · [Sentry Electron SDK](https://docs.sentry.io/platforms/javascript/guides/electron/) | 全文 |

## 第四部分 · 关键组合技术

| 章节 | 官方权威 | 必读 section |
|---|---|---|
| [24 · .node 扩展](/part4-advanced/24-native-node) | [官方 Native Node Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) · [node-addon-api](https://github.com/nodejs/node-addon-api) | 全文 |
| [25 · 原生 SDK 集成](/part4-advanced/25-sdk-integration) | [官方 Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc) | 全文 |
| [26 · 音视频与 RTC](/part4-advanced/26-av-rtc) | [官方 WebRTC Custom Encryption](https://www.electronjs.org/docs/latest/tutorial/web-preferences) · [chromium WebRTC](https://webrtc.org/) | 全文 |
| [27 · Electron 定制](/part4-advanced/27-customize) | [官方 Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses) · [官方 Source Code](https://github.com/electron/electron) | 全文 |
| [28 · 插件系统](/part4-advanced/28-plugin-system) | [官方 Loading Web Content](https://www.electronjs.org/docs/latest/tutorial/security#offscreen-rendering) | offscreen rendering + plugin architecture |

## 第五部分 · 实战项目

| 章节 | 官方权威 | 必读 section |
|---|---|---|
| [29 · 截屏录屏工具](/part5-projects/29-project-screenshot-recorder) | [desktopCapturer](https://www.electronjs.org/docs/latest/api/desktop-capturer) + [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) | 全文 |
| [30 · 多窗口工作台](/part5-projects/30-project-multiwindow) | [BaseWindow](https://www.electronjs.org/docs/latest/api/base-window) + [Session](https://www.electronjs.org/docs/latest/api/session) | 全文 |

## Appendix

| 章节 | 官方权威 | 必读 section |
|---|---|---|
| [路线图](/appendix/roadmap) | [官方 Tutorial](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app) | 全文 |
| [命令行速查](/appendix/cli-reference) | [官方 Command Line Switches](https://www.electronjs.org/docs/latest/api/command-line-switches) | 全部 |
| [版本策略](/appendix/versioning) | [官方 Releases](https://releases.electronjs.org/) · [Release Schedule](https://releases.electronjs.org/schedule) · [Breaking Changes](https://www.electronjs.org/docs/latest/breaking-changes) | 全部 |
| [术语表](/appendix/glossary) | [官方 Glossary](https://www.electronjs.org/docs/latest/glossary) | 全文 |
| [应用 Hub](/hub/apps) | （社区共识） | — |
| [资料 Hub](/hub/resources) | （社区共识） | — |
| [案例库](/cases/01-zoom-white-screen) | （本站实战案例） | — |

## 版本锚点

本站示例与验证均基于以下 Electron / Node / Chromium 版本组合（2026-09 时点）：

| Electron | Node | Chromium | 备注 |
|---|---|---|---|
| 30.x | 20.x | 124+ | 沙箱默认值已稳定（sandbox: true since 20） |
| 31.x | 20.x | 126+ | WebContentsView 取代 BrowserView 的稳定线 |

查询入口：[releases.electronjs.org](https://releases.electronjs.org/) 各版本旁直接标注所对应的 Chromium 与 Node 版本。

## 用法

学习一个能力节点时：

1. 先读本站章节（这是「为什么」+ 生产经验）
2. 再点对应官方链接读 section（这是「是什么」+ API 行为）
3. 读完做 mastery probes 里对应能力的四件套任务
4. 跑 demos 里配套示例

冲突处理：API 行为以官方文档为准；「为什么这么做」以本站为准；版本差异以查询入口为准。