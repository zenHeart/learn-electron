# 学习路线图

> 四周从零到交付：每周一个可验证的小项目，练完能回答一组关键问题。已有基础的同学可以直接跳到对应周，或用文末的[「按问题找答案」](#按问题找答案)反向索引直达章节。

## 路线总览

| 周次 | 主题 | 学哪几篇 | 周末交付物 |
| --- | --- | --- | --- |
| 第 1 周 | 认知地基 | [01](/guide/01-what-is-electron) [02](/guide/02-process-model) [03](/guide/03-lifecycle) | 改造版 quick start（按钮通过 IPC 调系统对话框） |
| 第 2 周 | 开发主力 | [04](/guide/04-security) [05](/guide/05-ipc) [06](/guide/06-windows) [07](/guide/07-system) [08](/guide/08-storage) [09](/guide/09-webview) | Markdown 笔记本（多窗口 / 本地存储 / 菜单 / 深色模式） |
| 第 3 周 | 交付链路 | [10](/guide/10-native) [11](/guide/11-packaging) [12](/guide/12-signing) [13](/guide/13-updates) [14](/guide/14-cicd) | 三平台安装包 + 自动更新跑通 |
| 第 4 周 | 质量保障 | [15](/guide/15-debugging) [16](/guide/16-performance) [17](/guide/17-testing) [18](/guide/18-observability) | 笔记本的 Playwright 集成测试 + 崩溃上报接入 |

节奏建议：工作日每天读 1 篇（30–40 分钟），周末集中半天写练习。判断标准是「练习能独立完成」，不是「文章看完了」。

## 第 1 周 · 认知地基

**目标**：建立进程模型的第一直觉——看到任何 Electron 功能，先问「这件事发生在哪个进程」。

**学**：[Electron 是什么](/guide/01-what-is-electron) → [进程模型](/guide/02-process-model) → [应用生命周期](/guide/03-lifecycle)。

**动手练习**（可验证的小项目）：

1. 跑通[官方 quick start](https://www.electronjs.org/docs/latest/quick-start)，说出 `main.js` 与 `preload.js` 各自运行在哪个进程。
2. 改造它：渲染进程加一个「保存」按钮，通过 IPC 调用主进程的 `dialog.showSaveDialog()`，把输入框内容写成文件。IPC 语法可以先照抄 [IPC 通信](/guide/05-ipc)开头的例子，原理第 2 周补。
3. 在任务管理器（macOS 活动监视器）里数一数你的应用有几个进程，标注各自角色。

**自查清单**——离开搜索引擎，你能回答：

- 主进程和渲染进程各自的职责边界是什么？为什么渲染进程默认不该有 Node 能力？
- `app.whenReady()` 之前能创建 `BrowserWindow` 吗？为什么？
- 关掉所有窗口，应用退出了吗？macOS 和 Windows 行为差异是什么？

## 第 2 周 · 开发主力

**目标**：独立完成一个功能完整的桌面小应用，覆盖窗口、系统能力、存储三个主战场。

**学**：[安全模型](/guide/04-security) → [IPC 通信](/guide/05-ipc) → [窗口管理](/guide/06-windows) → [系统能力](/guide/07-system) → [数据与存储](/guide/08-storage) → [嵌入 Web 内容](/guide/09-webview)。

**动手练习**：做一个 Markdown 笔记本，验收标准：

- 「新建笔记」开新窗口，主窗口列表实时更新（多窗口通信，[06](/guide/06-windows)）
- 笔记自动保存到用户数据目录，重启不丢（[08](/guide/08-storage)）
- 有系统菜单：新建 / 保存 / 导出 HTML（[07](/guide/07-system)）
- 跟随系统深色模式切换主题（[07](/guide/07-system)）
- preload 暴露的 API 面不超过应用真正需要的（[04](/guide/04-security)）

**自查清单**：

- contextIsolation 开着时，渲染进程怎么安全地拿到主进程能力？
- `app.getPath('userData')` 下应该放什么，不该放什么？
- 两个窗口之间直接共享一个 JS 对象可行吗？正确的做法是什么？

## 第 3 周 · 交付链路

**目标**：把应用交给一个没装过 Node 的同事，他能装、能用、能收到更新。

**学**：[原生能力扩展](/guide/10-native) → [打包与分发](/guide/11-packaging) → [签名与公证](/guide/12-signing) → [自动更新与热修复](/guide/13-updates) → [CI/CD 与无头测试](/guide/14-cicd)。

**动手练习**：

1. 用 Electron Forge（或 electron-builder）打出 Windows + macOS 安装包，有条件补 Linux，目标三平台。
2. 给 macOS 包走签名 + 公证，给 Windows 包走签名；没有证书就在虚拟机/干净系统上验证未签名告警长什么样，理解签名的价值。
3. 接入 electron-updater（或 Forge 更新器），把第 2 步的安装包发到一个静态服务器，验证「旧版本 → 检查 → 下载 → 重启升级」全链路。
4. 把上述流程写成一个 CI 脚本：push tag → 自动打包 → 自动发布。

**自查清单**：

- asar 是什么？哪些文件必须 unpack 出来？
- macOS 的公证（notarization）和签名是两回事吗？不做公证用户会遇到什么？
- 全量更新和增量更新差在哪？差分包在服务端要准备什么？

## 第 4 周 · 质量保障

**目标**：应用出了问题，你能定位、能复现、能收到线上的崩溃报告——而不是「在我电脑上是好的」。

**学**：[调试体系](/guide/15-debugging) → [性能优化](/guide/16-performance) → [测试实践](/guide/17-testing) → [监控与可观测性](/guide/18-observability)。

**动手练习**：

1. 给笔记本应用补 Playwright 集成测试：启动真实应用 → 新建笔记 → 输入 → 重启后内容还在（[17](/guide/17-testing)，跑在 [14](/guide/14-cicd) 搭的 CI 上）。
2. 接入崩溃上报：自建 Crashpad 收集服务或 Sentry Electron SDK，人为 `process.crash()` 验证收到 minidump 与符号化堆栈（[18](/guide/18-observability)）。
3. 用 DevTools Performance 面板录一次笔记本启动，找出最长的主进程/渲染进程阻塞点（[16](/guide/16-performance)）。

**自查清单**：

- 主进程卡死和渲染进程卡死，分别用什么工具定位？
- 收到的崩溃堆栈是一串地址，怎么变成可读的函数名（符号化）？
- 哪些性能问题应该在开发期拦截，哪些只能靠线上监控发现？

## 按问题找答案

| 你遇到的问题 | 去哪篇 |
| --- | --- |
| 窗口关了，进程还挂在后台 | [应用生命周期](/guide/03-lifecycle) |
| 主进程的 bug 怎么断点调试 | [调试体系](/guide/15-debugging) |
| 页面白屏 / 渲染花屏 | [性能优化](/guide/16-performance)、[缩放持久化白屏](/guide/cases/01-zoom-white-screen) |
| GPU 崩溃怎么排查 | [GPU 崩溃五步分析法](/guide/cases/02-gpu-crash) |
| 命令行开关不生效 | [命令行开关不生效](/guide/cases/07-flag-not-working)、[命令行速查](/appendix/cli-reference) |
| 想嵌入第三方网页，怕不安全 | [嵌入 Web 内容](/guide/09-webview)、[安全模型](/guide/04-security) |
| 数据存哪里、怎么迁移 | [数据与存储](/guide/08-storage) |
| 打包后体积爆炸 / 打不开 | [打包与分发](/guide/11-packaging) |
| macOS 上别人下载后打不开 | [签名与公证](/guide/12-signing) |
| 自动更新静默失败 | [自动更新与热修复](/guide/13-updates) |
| CI 上没有显示器怎么跑测试 | [CI/CD 与无头测试](/guide/14-cicd)、[测试实践](/guide/17-testing) |
| 线上崩溃怎么收集与分析 | [监控与可观测性](/guide/18-observability) |
| 要不要升级 Electron 大版本 | [版本策略与升级清单](/appendix/versioning) |
| 一个术语看不懂 | [术语表](/appendix/glossary) |
