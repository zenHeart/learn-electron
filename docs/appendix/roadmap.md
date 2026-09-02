# 学习路线图

> 四周从零到交付：每周一个可验证的小项目，练完能回答一组关键问题。已有基础的同学可以直接跳到对应周，或用文末的[「按问题找答案」](#按问题找答案)反向索引直达章节。

## 路线总览

| 周次 | 主题 | 学哪几篇 | 周末交付物 |
| --- | --- | --- | --- |
| 第 1 周 | 背景 + 核心地基 | 第一部分 [01](/part1-background/01-what-is-electron)–[05](/part1-background/05-lifecycle) + 第二部分 [06 第一课](/part2-core/06-first-app) | 改造版 quick start（跟 [用例集](/examples/) 01–03） |
| 第 2 周 | 核心知识主线 | [09 IPC](/part2-core/09-ipc) [10 安全](/part2-core/10-security) [11 系统](/part2-core/11-system) [12 存储](/part2-core/12-storage) [13 配置](/part2-core/13-config) [07 窗口](/part2-core/07-windows) | Markdown 笔记本（多窗口 / 配置持久化 / 原子写存储） |
| 第 3 周 | 工程全链路 | [15 脚手架](/part3-engineering/15-scaffold) [19 打包](/part3-engineering/19-packaging) [20 签名](/part3-engineering/20-signing) [21 更新](/part3-engineering/21-releases-updates) [22 CI/CD](/part3-engineering/22-cicd)；按需 [08 截屏](/part2-core/08-screenshot) [14 Webview](/part2-core/14-webview) | 三平台安装包 + 自动更新跑通 |
| 第 4 周 | 质量 + 进阶 + 实战 | [16 调试](/part3-engineering/16-debugging) [17 测试](/part3-engineering/17-testing) [18 性能](/part3-engineering/18-performance) [23 监控](/part3-engineering/23-observability) + 第四部分选读 + [实战项目](/part5-projects/29-project-screenshot-recorder) + [案例库](/cases/01-zoom-white-screen)通读 | 完成项目一（截屏录屏工具）+ Playwright 测试 + 崩溃上报 |

节奏建议：工作日每天读 1 篇（30–40 分钟），周末集中半天写练习。判断标准是「练习能独立完成」，不是「文章看完了」。

## 第 1 周 · 背景 + 核心地基

**目标**：建立进程模型的第一直觉（看到任何功能先问「发生在哪个进程」），亲手跑通第一个应用。

**学**：[Electron 是什么](/part1-background/01-what-is-electron) → [发展历史](/part1-background/02-history) → [技术架构](/part1-background/03-architecture) → [进程模型](/part1-background/04-process-model) → [应用生命周期](/part1-background/05-lifecycle) → [新人第一课](/part2-core/06-first-app)。

**动手练习**（可验证的小项目）：

1. 跟着第六章跑通第一个应用，跟[用例集](/examples/) 01–03 逐个做完。
2. 说出 `main.js` 与 `preload.js` 各自运行在哪个进程。
3. 在任务管理器（macOS 活动监视器）里数一数你的应用有几个进程，标注各自角色。

**自查清单**——离开搜索引擎，你能回答：

- 主进程和渲染进程各自的职责边界是什么？为什么渲染进程默认不该有 Node 能力？
- `app.whenReady()` 之前能创建 `BrowserWindow` 吗？为什么？
- 关掉所有窗口，应用退出了吗？macOS 和 Windows 行为差异是什么？

## 第 2 周 · 核心知识主线

**目标**：独立完成一个功能完整的桌面小应用，打穿 IPC、安全、存储、配置、多窗口。

**学**：[IPC 通信](/part2-core/09-ipc) → [安全模型](/part2-core/10-security) → [系统能力](/part2-core/11-system) → [存储架构](/part2-core/12-storage) → [配置系统](/part2-core/13-config) → [窗口体系](/part2-core/07-windows)。

**动手练习**：做一个 Markdown 笔记本，验收标准：

- 「新建笔记」开新窗口，主窗口列表实时更新（多窗口通信，[07](/part2-core/07-windows)）
- 笔记自动保存到用户数据目录，重启不丢（[12](/part2-core/12-storage)）
- 有系统菜单：新建 / 保存 / 导出 HTML（[11](/part2-core/11-system)）
- 跟随系统深色模式切换主题（[11](/part2-core/11-system)）
- preload 暴露的 API 面不超过应用真正需要的（[10](/part2-core/10-security)）

**自查清单**：

- contextIsolation 开着时，渲染进程怎么安全地拿到主进程能力？
- `app.getPath('userData')` 下应该放什么，不该放什么？
- 两个窗口之间直接共享一个 JS 对象可行吗？正确的做法是什么？

## 第 3 周 · 工程全链路

**目标**：把应用交给一个没装过 Node 的同事——他能装、能用、能收到更新。

**学**：[工程脚手架](/part3-engineering/15-scaffold) → [打包与分发](/part3-engineering/19-packaging) → [签名与公证](/part3-engineering/20-signing) → [自动更新与热修复](/part3-engineering/21-releases-updates) → [CI/CD 与无头测试](/part3-engineering/22-cicd)。按产品形态选读 [截屏](/part2-core/08-screenshot) / [嵌入 Web 内容](/part2-core/14-webview)。

**动手练习**：

1. 用 Electron Forge（或 electron-builder）打出 Windows + macOS 安装包，有条件补 Linux，目标三平台。
2. 给 macOS 包走签名 + 公证，给 Windows 包走签名；没有证书就在虚拟机/干净系统上验证未签名告警长什么样，理解签名的价值。
3. 接入 electron-updater（或 Forge 更新器），把第 2 步的安装包发到一个静态服务器，验证「旧版本 → 检查 → 下载 → 重启升级」全链路。
4. 把上述流程写成一个 CI 脚本：push tag → 自动打包 → 自动发布。

**自查清单**：

- asar 是什么？哪些文件必须 unpack 出来？
- macOS 的公证（notarization）和签名是两回事吗？不做公证用户会遇到什么？
- 全量更新和增量更新差在哪？差分包在服务端要准备什么？

## 第 4 周 · 质量 + 进阶 + 实战

**目标**：应用出了问题，你能定位、能复现、能收到线上的崩溃报告；并用一个完整项目收束全书。

**学**：[调试体系](/part3-engineering/16-debugging) → [性能优化](/part3-engineering/18-performance) → [测试实践](/part3-engineering/17-testing) → [监控与可观测性](/part3-engineering/23-observability) → 按方向选读第四部分（[.node 扩展](/part4-advanced/24-native-node)/[定制](/part4-advanced/27-customize)/[插件系统](/part4-advanced/28-plugin-system)）→ [实战项目一](/part5-projects/29-project-screenshot-recorder) → [案例库](/cases/01-zoom-white-screen)七篇通读。

**动手练习**：

1. 给笔记本应用补 Playwright 集成测试：启动真实应用 → 新建笔记 → 输入 → 重启后内容还在（[17](/part3-engineering/17-testing)，跑在 [22](/part3-engineering/22-cicd) 搭的 CI 上）。
2. 接入崩溃上报：自建 Crashpad 收集服务或 Sentry Electron SDK，人为 `process.crash()` 验证收到 minidump 与符号化堆栈（[23](/part3-engineering/23-observability)）。
3. 用 DevTools Performance 面板录一次笔记本启动，找出最长的主进程/渲染进程阻塞点（[18](/part3-engineering/18-performance)）。

**自查清单**：

- 主进程卡死和渲染进程卡死，分别用什么工具定位？
- 收到的崩溃堆栈是一串地址，怎么变成可读的函数名（符号化）？
- 哪些性能问题应该在开发期拦截，哪些只能靠线上监控发现？

## 按问题找答案

| 你遇到的问题 | 去哪篇 |
| --- | --- |
| 窗口关了，进程还挂在后台 | [应用生命周期](/part1-background/05-lifecycle) |
| 主进程的 bug 怎么断点调试 | [调试体系](/part3-engineering/16-debugging) |
| 页面白屏 / 渲染花屏 | [性能优化](/part3-engineering/18-performance)、[缩放持久化白屏](/cases/01-zoom-white-screen) |
| GPU 崩溃怎么排查 | [GPU 崩溃五步分析法](/cases/02-gpu-crash) |
| 命令行开关不生效 | [命令行开关不生效](/cases/07-flag-not-working)、[命令行速查](/appendix/cli-reference) |
| 想嵌入第三方网页，怕不安全 | [嵌入 Web 内容](/part2-core/14-webview)、[安全模型](/part2-core/10-security) |
| 数据存哪里、怎么迁移 | [数据与存储](/part2-core/12-storage) |
| 打包后体积爆炸 / 打不开 | [打包与分发](/part3-engineering/19-packaging) |
| macOS 上别人下载后打不开 | [签名与公证](/part3-engineering/20-signing) |
| 自动更新静默失败 | [自动更新与热修复](/part3-engineering/21-releases-updates) |
| CI 上没有显示器怎么跑测试 | [CI/CD 与无头测试](/part3-engineering/22-cicd)、[测试实践](/part3-engineering/17-testing) |
| 线上崩溃怎么收集与分析 | [监控与可观测性](/part3-engineering/23-observability) |
| 要不要升级 Electron 大版本 | [版本策略与升级清单](/appendix/versioning) |
| 一个术语看不懂 | [术语表](/appendix/glossary) |
