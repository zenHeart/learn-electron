# 资料 Hub：权威与三方资料库

> 只收「值得放进收藏夹」的入口。本页按信源分层组织：官方权威 → 官方工具链 → 调试分析 → 三方深度资料 → 社区，最后给出「本书章节 → 资料」的阅读路径映射，学完一章顺路读对应资料。

信源分层的使用原则：结论冲突时，靠近上层的赢。

| 层 | 信源 | 什么时候信它 |
| --- | --- | --- |
| 官方权威 | 官方文档、博客、仓库 | 永远的第一信源；API 行为以它为准 |
| 官方工具 | Forge、fuses、rebuild 等 | 工具行为以仓库 README / 文档为准 |
| 三方深度 | 大厂工程博客、一手专访 | 用于理解「为什么」，不用于裁定 API 行为 |
| 社区 | awesome 清单、论坛、教程 | 找线索和轮子；引用前回官方文档复核 |

> 使用原则：外链会随官方站点改版而变动（例如官方 Quick Start 教程已重组为 `tutorial/tutorial-first-app`），打不开时优先从 [官方文档](https://www.electronjs.org/docs/latest) 首页侧栏重新定位，而不是依赖搜索引擎的缓存结果。本页所有链接均逐条验证过可达，工具的取舍理由见对应正文章节。

## L0 官方权威

### 官方文档：分区块使用

[官方文档](https://www.electronjs.org/docs/latest) 是唯一的第一信源，写代码前先对一遍。按使用场景分五个区块：

| 区块 | 地址 | 内容 | 适合谁读 |
| --- | --- | --- | --- |
| 教程区（Tutorial） | <https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app> | 从前置要求到第一个应用的成体系教程，旧 Quick Start 已并入此处 | 刚入门、按官方路径过一遍（[路线图第 1 周](/appendix/roadmap)起点） |
| 进程模型 | <https://www.electronjs.org/docs/latest/tutorial/process-model> | 主进程 / 渲染进程 / GPU 进程 / 工具进程的职责划分 | 所有读者；本书[进程模型](/part1-background/04-process-model)章的官方对照 |
| 最佳实践 | [安全](https://www.electronjs.org/docs/latest/tutorial/security) · [性能](https://www.electronjs.org/docs/latest/tutorial/performance) | 安全清单、性能指南等工程准则 | 进入生产环境前必读 |
| API 参考 | <https://www.electronjs.org/docs/latest>（首页侧栏 API 区） | 主进程 / 通用 / 渲染进程模块的逐个 API | 写代码时随手查 |
| 应用分发 | <https://www.electronjs.org/docs/latest/tutorial/application-distribution> | 打包、分发、代码签名的官方姿势 | 准备发布时读 |
| 开发指南（Development） | <https://www.electronjs.org/docs/latest/development/debugging> | 构建 Electron 本体、调试 Chromium 层源码的指南 | 想给 Electron 提 PR 或深挖源码的人 |

### 应用内速查页

调试时直接在应用地址栏输入（应用内地址，无需外链）：

| 地址 | 看什么 |
| --- | --- |
| `chrome://gpu` | GPU 状态与禁用项清单，显卡适配第一站 |
| `chrome://net-export` | 录制 NetLog 文件，配合 NetLog Viewer 分析 |
| `chrome://media-internals` | 音视频播放管线状态：解码器选择、缓冲、丢帧 |
| `chrome://webrtc-internals` | WebRTC 连接详情：ICE、码率、丢包（[音视频](/part4-advanced/26-av-rtc)） |
| `chrome://tracing` | 旧版时间轴录制入口；新版本优先用 `--trace-startup` + Perfetto |

### 版本与发布

| 名称 | 地址 | 一句话说明 | 适合谁读 |
| --- | --- | --- | --- |
| 版本发布站 | <https://releases.electronjs.org/> | 各版本对应的 Chromium / Node 版本、下载与版本支持线 | 升级选型、排查版本差异 |
| 发布时间表 | <https://releases.electronjs.org/schedule> | 各 major 的 alpha / stable / EOL 日期 | 规划升级窗口（配合[版本策略](/appendix/versioning)） |
| endoflife.date/electron | <https://endoflife.date/electron> | 第三方 EOL 追踪页：一眼看清各 major 还剩多久支持 | 快速判断「还能不能不升」 |

### 博客与社区入口

| 名称 | 地址 | 一句话说明 | 适合谁读 |
| --- | --- | --- | --- |
| 官方博客 | <https://www.electronjs.org/blog> | 每个 major 发布公告与重要变更解读 | 升级前必读对应篇 |
| 10 周年回顾 | [英文](https://www.electronjs.org/blog/10-years-of-electron) · [中文](https://www.electronjs.org/zh/blog/10-years-of-electron) | 十年项目史：首 commit、27000+ 提交、1192 位贡献者 | 想理解项目从哪来（配合[发展历史](/part1-background/02-history)） |
| Electron Fiddle | <https://www.electronjs.org/fiddle> | 官方沙盒：不建项目就试 API，可切版本、导出 Gist 复现 bug | 所有人；复现 issue 的最小成本载体 |
| 官方 Discord | <https://www.electronjs.org/community> | 官方社区入口页，含 Discord 邀请 | 实时提问与案例交流 |
| GitHub Issues | <https://github.com/electron/electron/issues> | 疑难杂症先搜这里——「只有我遇到吗」的答案通常在 issue 区 | 排查任何奇怪行为 |
| Electron 主仓库 | <https://github.com/electron/electron> | 读源码、提 PR、追某个修复进了哪个分支 | 深度参与者 |
| 安全公告 | <https://github.com/electron/electron/security/advisories> | 官方 CVE 公告列表，判断是否需要紧急升级 | 维护线上应用的所有人 |

## 官方工具链

按「建项目 → 改原生 → 加固 → 签名 → 发布」的使用顺序排列。

| 名称 | 地址 | 定位 | 适合谁读 |
| --- | --- | --- | --- |
| Electron Forge | <https://www.electronforge.io/> | 官方一体化工具链：脚手架、打包、签名、更新一条龙 | 新项目默认选择（[工程脚手架](/part3-engineering/15-scaffold)） |
| electron-builder | <https://www.electron.build/> | 社区主流打包器：安装包格式与自动更新配置最丰富 | Forge 覆盖不了的打包形态（[打包](/part3-engineering/19-packaging)） |
| @electron/packager | <https://github.com/electron/packager> | 只把应用打成可执行目录，安装格式自己另做（Forge 底层之一） | 深度自定义打包流程 |
| @electron/rebuild | <https://github.com/electron/rebuild> | 原生模块按当前 Electron 的 ABI 重编，装完原生依赖必跑 | 用了 .node 模块的人（[.node 扩展](/part4-advanced/24-native-node)、[SDK 集成](/part4-advanced/25-sdk-integration)） |
| @electron/fuses | <https://github.com/electron/fuses> | 构建期开关：禁用 runAsNode、限制 cookie 等运行时行为的硬闸 | 加固阶段（[Electron 定制](/part4-advanced/27-customize)） |
| @electron/windows-sign | <https://github.com/electron/windows-sign> | Windows 签名：支持 EV 证书、云 HSM（DigiCert KeyLocker / AWS CloudHSM 等） | Windows 发布（[签名](/part3-engineering/20-signing)） |
| @electron/osx-sign | <https://github.com/electron/osx-sign> | macOS 签名与公证的底层工具（Forge / builder 内部也用它） | macOS 发布（[签名](/part3-engineering/20-signing)） |
| electron-notarize | <https://github.com/electron/notarize> | macOS 公证专用：让应用通过 Gatekeeper 校验 | macOS 发布链路（[签名](/part3-engineering/20-signing)） |
| electron-devtools-installer | <https://www.npmjs.com/package/electron-devtools-installer> | 装 React/Vue 等 DevTools 扩展；维护不活跃，能用 `session.loadExtension` 手动加载就优先手动（见[官方教程](https://www.electronjs.org/docs/latest/tutorial/devtools-extension)） | 需要框架 DevTools 时 |

## 调试与分析工具

| 名称 | 地址 | 一句话说明 | 适合谁读 |
| --- | --- | --- | --- |
| Perfetto UI | <https://ui.perfetto.dev/> | 打开 trace 文件看时间轴：启动耗时、卡顿归因 | 性能排查（[调试体系](/part3-engineering/16-debugging)） |
| NetLog Viewer | <https://netlog-viewer.appspot.com/> | 拖入 `--log-net-log` 产出的文件，逐事件查网络请求 | 网络层疑难杂症（[调试体系](/part3-engineering/16-debugging)） |
| chrome://gpu | 应用地址栏直接输入 | 看 GPU 状态与禁用项清单：显卡支持哪些特性一目了然 | 渲染 / 显卡适配（[性能优化](/part3-engineering/18-performance)） |
| chrome://net-export | 应用地址栏直接输入 | 一键开始 / 停止网络日志录制，产出 NetLog 文件 | 配合 NetLog Viewer 使用 |
| VMMap | <https://learn.microsoft.com/en-us/sysinternals/downloads/vmmap> | 微软 Sysinternals 的进程内存分析器：按 committed / working set 拆解内存构成 | Windows 内存问题（[性能优化](/part3-engineering/18-performance)） |
| CDP 协议文档 | <https://chromedevtools.github.io/devtools-protocol/> | 写自动化注入 / 自定义调试工具时查协议字段 | 深度定制调试链路 |
| Sentry（Electron SDK） | <https://docs.sentry.io/platforms/javascript/guides/electron/> · [GitHub](https://github.com/getsentry/sentry-electron) | 不想自建崩溃收集时的 SaaS 方案，minidump 符号化一条龙 | 线上监控（[监控](/part3-engineering/23-observability)） |

## 深度技术资料（三方高质量）

由真实大厂产品验证过的一手资料，读源码级内容时的第二信源。

| 资料 | 地址 | 一句话说明 | 适合谁读 |
| --- | --- | --- | --- |
| VS Code 沙箱迁移博客 | <https://code.visualstudio.com/blogs/2022/11/28/vscode-sandbox> | VS Code 花数年把渲染进程迁入沙箱的全过程：动机、兼容策略、踩坑 | 理解为什么要禁 Node 集成（[安全模型](/part2-core/10-security)） |
| VS Code 扩展 API 文档 | [入口](https://code.visualstudio.com/api) · [扩展概览](https://code.visualstudio.com/docs/extensions/overview) | 工业级插件系统的公开设计：激活事件、贡献点、进程隔离 | 设计插件系统（[插件系统设计](/part4-advanced/28-plugin-system)） |
| 1Password electron-secure-defaults | <https://github.com/1Password/electron-secure-defaults> | 安全敏感应用的标杆开源的安全起步模板，逐条对照官方安全清单 | 写安全敏感型应用（[安全模型](/part2-core/10-security)） |
| QQ NT 架构专访 | <https://www.infoq.cn/article/PzQfDeSeXzhIacxzVSc9> | 腾讯 QQ 十年重构选型：为什么三端统一最终落在 Electron | 做跨平台选型决策 |
| QQ NT 团队专访 | <https://www.infoq.cn/article/99suibztx2be1fwvqjwg> | 24 岁 QQ 重构背后的思考：框架成熟度与人才成本权衡 | 选型汇报的论证材料 |
| QQ NT 内存优化 | [掘金](https://juejin.cn/post/7264503868131360768) · [阿里云](https://developer.aliyun.com/article/1327526) | Electron 内存从超标到可控的治理实战：按需渲染、泄漏排查 | 内存治理（[性能优化](/part3-engineering/18-performance)） |
| 语雀桌面端架构 | <https://juejin.cn/post/7145014659584622629> | 蚂蚁工程师的桌面端架构决策与通用方案沉淀 | 国内工程实践参照 |
| 飞书 Electron 开发实践 | <https://whwtree.com/archives/electron-development-practice-feishu-1.html> | 飞书早期基于 Electron 的跨平台客户端开发实践（转载，原文渠道已难追溯） | 大厂桌面端方案演进参照（飞书后期已转自研，见[应用 Hub](/hub/apps)） |
| Chromium 多进程架构 | <https://www.chromium.org/developers/design-documents/multi-process-architecture/> | Electron 进程模型的上游设计文档：为什么浏览器要多进程 | 想挖到下一层原理 |
| V8 文档 | <https://v8.dev/> | JS 引擎层的问题：GC、`--js-flags`、内存语义 | 遇到引擎层疑难 |

## 深入底层：Chromium 源码级

| 名称 | 地址 | 什么时候用 |
| --- | --- | --- |
| Chromium 源码浏览器 | <https://source.chromium.org/> | Chromium 全量源码检索的总入口 |
| Chromium trace_event 源码 | <https://source.chromium.org/chromium/chromium/src/+/main:base/trace_event/> | 追踪打点的原始定义，看懂 trace 输出里的字段含义 |
| Chromium 开关与特性清单 | <https://source.chromium.org/chromium/chromium/src/+/main:base/base_switches.cc> | 确认一个命令行开关在本版本 Chromium 里真实存在（配合[速查页三步法](/appendix/cli-reference)） |
| Mojo 文档 | <https://chromium.googlesource.com/chromium/src/+/main/mojo/README.md> | 理解 Chromium 进程间通信地基，读懂进程模型的下一层 |
| Chromium GPU 配置源码 | <https://chromium.googlesource.com/chromium/src/+/main/gpu/config/> | GPU 控制列表（黑名单 / workaround）的原始定义，显卡适配问题查到根 |

## 社区

| 名称 | 地址 | 一句话说明 | 适合谁读 |
| --- | --- | --- | --- |
| awesome-electron | <https://github.com/sindresorhus/awesome-electron> | 社区维护的精选清单：工具、组件、示例应用一站索引 | 找轮子之前先翻一遍 |
| Electron China（electronjs-cn） | <https://github.com/electronjs-cn> | 中文社区组织：官方博客中文翻译与交流群（官方博客致谢 @BlackHole1 协助建立用户群） | 中文提问与跟进官方动态 |
| 官方 Discord | <https://www.electronjs.org/community> | 官方社区入口（同 L0 区，最活跃的实时渠道） | 英文实时交流 |
| electron-builder 文档站 | <https://www.electron.build/> | 打包器文档：配置项远比想象中多（同工具链区） | 用 builder 打包时 |
| 官方 apps 目录 | <https://www.electronjs.org/apps> | 数百个应用 + 提交收录入口 | 选型调研（见[应用 Hub](/hub/apps)） |

## 学习路径建议：本书章节 → 资料

学完一章，顺路读对应资料，把书里的结论落到一手信源上。

| 读到本书哪里 | 顺路去读 | 能获得什么 |
| --- | --- | --- |
| [01–05 背景篇](/part1-background/01-what-is-electron) | [10 周年回顾](https://www.electronjs.org/blog/10-years-of-electron)、[Chromium 多进程架构](https://www.chromium.org/developers/design-documents/multi-process-architecture/) | 项目史实与进程模型的上游原理 |
| [04 进程模型](/part1-background/04-process-model) | [官方 process-model 文档](https://www.electronjs.org/docs/latest/tutorial/process-model) | 本书图示与官方口径逐条对齐 |
| [06 第一个应用](/part2-core/06-first-app) | [官方第一个应用教程](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app)、[Fiddle](https://www.electronjs.org/fiddle) | 官方路径重走一遍 + 沙盒随手试 |
| [10 安全模型](/part2-core/10-security) | [官方安全指南](https://www.electronjs.org/docs/latest/tutorial/security)、[electron-secure-defaults](https://github.com/1Password/electron-secure-defaults)、[VS Code 沙箱博客](https://code.visualstudio.com/blogs/2022/11/28/vscode-sandbox) | 从官方清单到工业级落地的完整光谱 |
| [15 工程脚手架](/part3-engineering/15-scaffold) | [Electron Forge](https://www.electronforge.io/) | 官方工具链全貌与配置细节 |
| [16 调试体系](/part3-engineering/16-debugging) | [Perfetto](https://ui.perfetto.dev/)、[NetLog Viewer](https://netlog-viewer.appspot.com/)、[CDP 文档](https://chromedevtools.github.io/devtools-protocol/) | 每类分析工具的官方使用说明 |
| [18 性能优化](/part3-engineering/18-performance) | [官方性能指南](https://www.electronjs.org/docs/latest/tutorial/performance)、[QQ NT 内存优化](https://juejin.cn/post/7264503868131360768)、[VMMap](https://learn.microsoft.com/en-us/sysinternals/downloads/vmmap) | 官方准则 + 亿级应用的治理实战 |
| [19–20 打包与签名](/part3-engineering/19-packaging) | [Forge](https://www.electronforge.io/)、[electron-builder](https://www.electron.build/)、[windows-sign](https://github.com/electron/windows-sign)、[notarize](https://github.com/electron/notarize) | 各平台签名公证的操作细节 |
| [21 自动更新](/part3-engineering/21-releases-updates) | [Forge 更新文档](https://www.electronforge.io/)、[发布时间表](https://releases.electronjs.org/schedule) | 更新通道设计与版本节奏规划 |
| [23 监控](/part3-engineering/23-observability) | [Sentry Electron SDK](https://docs.sentry.io/platforms/javascript/guides/electron/) | 崩溃收集的现成方案 |
| [24–25 原生集成](/part4-advanced/24-native-node) | [@electron/rebuild](https://github.com/electron/rebuild) | 原生模块重编的官方姿势 |
| [27 Electron 定制](/part4-advanced/27-customize) | [@electron/fuses](https://github.com/electron/fuses) | 构建期加固开关全集 |
| [28 插件系统设计](/part4-advanced/28-plugin-system) | [VS Code 扩展 API](https://code.visualstudio.com/api) | 工业级插件系统的公开设计范本 |
| [29–30 实战项目](/part5-projects/29-project-screenshot-recorder) | [官方 apps 目录](https://www.electronjs.org/apps)、[awesome-electron](https://github.com/sindresorhus/awesome-electron) | 找同类产品对标、找现成轮子 |
| 升级窗口期 | [发布时间表](https://releases.electronjs.org/schedule)、[安全公告](https://github.com/electron/electron/security/advisories)、[官方博客](https://www.electronjs.org/blog) | 何时必须升、升了会断什么 |

读完本书后，保持两个习惯即可不脱节：major 发布时扫一遍[官方博客](https://www.electronjs.org/blog)，季度性翻一次[安全公告](https://github.com/electron/electron/security/advisories)。
