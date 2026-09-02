# 应用 Hub：谁在用 Electron

> 选型最硬的证据不是评测，而是「谁已经把它用到了亿级用户规模」。这张清单既是技术选型的参照系——你要做的产品类型几乎都能找到同款先行者——也是 Electron 生态健康度的直接证明。
>
> 清单用法：先在[按领域索引](#按领域索引)找到你的产品类型 → 读对标应用的架构看点 → 顺着信源读一手分享 → 再回到本书对应章节动手。全部条目以[官方 apps 目录](https://www.electronjs.org/apps)与各团队公开技术分享为准。

## 旗舰应用：官方精选

以下六个应用出自官方 apps 页首页精选（[electron/website](https://github.com/electron/website) 仓库维护的 FEATURED 清单），每一个都代表一类架构路线的标杆。

| 应用 | 领域 | 架构看点 | 深入资料 |
| --- | --- | --- | --- |
| [Visual Studio Code](https://code.visualstudio.com/) | 开发工具 | 多进程架构运用的天花板：扩展宿主（Extension Host）独立进程承载全部插件，扩展卡死不拖累编辑器主进程 | [扩展 API 文档](https://code.visualstudio.com/api) · [沙箱迁移博客](https://code.visualstudio.com/blogs/2022/11/28/vscode-sandbox) |
| [Figma](https://www.figma.com/) | 设计创作 | 混合架构代表：C++ 渲染内核编译为 WebAssembly 跑在 WebGL 上，Electron 只负责窗口与系统能力——重度计算下沉、UI 层留 Web | 与 VS Code 相对的另一条路线：壳轻引擎重（见[性能优化](/part3-engineering/18-performance)） |
| [1Password](https://1password.com/) | 安全 | Electron 安全最佳实践的开源范本：起步模板逐条对照官方安全清单落地，配套 electron-hardener 加固 | [electron-secure-defaults](https://github.com/1Password/electron-secure-defaults) |
| [Slack](https://slack.com/) | 协作办公 | 多工作区、多窗口、常驻托盘的重度形态在亿级用户上长期验证；大规模工程实践常被官方文档引用 | [官方 apps 目录](https://www.electronjs.org/apps)检索 Slack |
| ChatGPT | AI 助手 | OpenAI 桌面客户端：全局快捷键唤起、屏幕理解等系统级深度集成，展示 Electron 做「轻壳重 AI」产品的迭代速度 | OpenAI 官网下载入口（openai.com，站点有反爬无法直接验证，从官网导航进入） |
| [Claude](https://claude.ai/download) | AI 助手 | Anthropic 桌面客户端：与 ChatGPT 同期入选官方精选，代表 2023 年后 AI 助手类桌面应用的整条品类崛起 | [官方下载页](https://claude.ai/download) |

::: tip 两条路线，一张图记住
VS Code 与 Figma 是两种极端：VS Code 把「重逻辑」放在独立的 Node 进程里、渲染层保持轻；Figma 把「重计算」下沉到 C++/WASM、Electron 退化为壳。你的应用落在两者之间，本书[进程模型](/part1-background/04-process-model)与[插件系统](/part4-advanced/28-plugin-system)两章会反复回到这两个样本。
:::

## 广泛使用的主流应用

以下应用均收录于[官方 apps 目录](https://www.electronjs.org/apps)。按领域分成三组，方便对号入座。

### 协作与沟通

这一组证明 Electron 最成熟的主战场：常驻后台、多端同步、实时消息。

| 应用 | 一句话看点 |
| --- | --- |
| [Discord](https://discord.com/) | 数亿用户的游戏社区客户端：实时语音 + 数百人频道的性能压力测试场 |
| [Notion](https://www.notion.com/desktop) | 重文档渲染与本地缓存的典型：离线优先的数据同步设计 |
| [Slack](https://slack.com/) | 多工作区多窗口的老牌标杆（同旗舰表） |
| [Asana](https://asana.com/) | 典型「Web 应用包壳增强」路线：桌面端为 Web 核心补齐通知、菜单、离线 |
| [WhatsApp Desktop](https://www.whatsapp.com/download) | Meta 系桌面客户端，与移动端实时同步的常驻型应用 |
| Microsoft Teams（经典版） | 经典版 Teams 基于 Electron；2023 起新版逐步转向 WebView2，两条路线的对照样本 |

### 开发与知识工具

这一组的应用都以「长时间开着不关」为常态，长会话内存控制是共同课题。

| 应用 | 一句话看点 |
| --- | --- |
| [GitHub Desktop](https://desktop.github.com/) | 2017 年 GitHub 用 Electron 重写双平台客户端，重写决策过程有官方博客公开 |
| [Obsidian](https://obsidian.md/) | 本地 Markdown 文件 + 插件生态：不锁数据的桌面应用商业模式样本 |
| [Postman](https://www.postman.com/downloads/) | 工具类复杂度上限参照：请求构造、脚本、集合、Mock 一应俱全 |

### 文件与媒体

这一组对系统能力（文件监控、屏幕捕获）的要求高于对 UI 复杂度的要求。

| 应用 | 一句话看点 |
| --- | --- |
| [Dropbox](https://www.dropbox.com/) | 系统托盘常驻型应用：文件监控与跨平台路径处理的老牌案例 |
| [Loom](https://www.loom.com/desktop) | 屏幕录制 + 即时分享的轻量形态（本书[截屏项目](/part5-projects/29-project-screenshot-recorder)的商用参照） |

> 注意：官方 apps 目录是开放提交的，收录不等于官方验证。个别历史条目（如 Spotify）长期被社区指出实际基于 CEF 而非 Electron，选型时以各团队自己公开的技术分享为准。

## 国内产品

国内大厂的公开技术分享相对少，以下条目每条注明信源；信源强度不同，请按标注自行判断。

| 产品 | 团队 | 技术要点 | 公开信源 |
| --- | --- | --- | --- |
| QQ NT（新版 QQ 桌面端） | 腾讯 | 三端（Win/macOS/Linux）一套架构；Electron 只承担 UI 跨平台层，核心逻辑在跨平台 C++ 层 | InfoQ 专访两篇（见下） |
| QQ NT 内存优化 | 腾讯 | Electron 应用的内存优化实战：按需渲染、资源加载治理、泄漏排查 | 掘金 / 阿里云开发者社区（见下） |
| 语雀桌面端 | 蚂蚁集团 | 桌面端采用 React + Electron，跨端统一 JS/TS 技术栈 | 蚂蚁工程师掘金分享两篇（见下） |
| 飞书桌面端 | 字节跳动 | 早期基于 Electron 构建（有官方开发实践分享流传）；据社区分析后期转向自研类 CEF 方案追求内存控制 | 官方分享转载（见下） |
| 钉钉桌面版 | 阿里巴巴 | 早期桌面版被第三方资料佐证为 Electron + Web 版构建；官方未发布架构专文，信源强度弱于上列条目 | 社区技术资料佐证，无官方一手信源 |

QQ NT 的四篇一手信源（均验证可达）：

| 信源 | 类型 | 回答什么问题 |
| --- | --- | --- |
| [InfoQ · 十年架构重构，为多端统一，QQ 选用了 Electron](https://www.infoq.cn/article/PzQfDeSeXzhIacxzVSc9) | 报道 | 为什么是 Electron：与 Qt / 自研 / WebView 容器的选型对比 |
| [InfoQ · QQ NT 全新重构，探寻 24 岁 QQ 大重构背后的思考](https://www.infoq.cn/article/99suibztx2be1fwvqjwg) | 团队专访 | 选型标准：框架成熟度、技术栈标准化、人才成本 |
| [掘金 · 新 QQ NT 桌面版内存优化探索之路](https://juejin.cn/post/7264503868131360768) | 实践 | 选完之后怎么还债：内存从超标到可控的治理路径 |
| [阿里云 · 新 QQ 桌面版的 Electron 内存优化实践](https://developer.aliyun.com/article/1327526) | 实践（系列） | 同主题系列篇：按需渲染与泄漏排查细节 |

语雀与飞书的信源（均验证可达）：

| 信源 | 出处 | 要点 |
| --- | --- | --- |
| [语雀桌面端技术架构实践](https://juejin.cn/post/7145014659584622629) | 蚂蚁工程师 · 掘金 | 桌面端架构决策与通用桌面方案沉淀 |
| [语雀 App 跨端技术架构实践](https://juejin.cn/post/7166549441066106917) | 蚂蚁工程师 · 掘金 | PC 用 React、桌面端用 React + Electron 的跨端分层 |
| [基于 Electron 的跨平台桌面客户端开发实践（转载）](https://whwtree.com/archives/electron-development-practice-feishu-1.html) | 飞书团队分享 · 转载 | 飞书早期 Electron 实践；原文渠道已不易追溯，注意甄别 |

QQ NT 是目前公开资料最完整的国内样本：两篇 InfoQ 讲清「为什么选」，两篇内存优化讲清「选完之后怎么还债」。做选型汇报时，这四篇是现成的论证材料。

## 按领域索引

按你要做的产品类型找参照，每个领域至少有一个标杆样本可对标；「本书章节」列指向最相关的那一章。

| 领域 | 对标应用 | 看什么 | 本书章节 |
| --- | --- | --- | --- |
| 开发工具 | VS Code、GitHub Desktop、Postman | 多进程隔离、插件宿主、长会话内存控制 | [插件系统设计](/part4-advanced/28-plugin-system) |
| 协作办公 / IM | Slack、Teams、Discord、QQ NT、飞书、钉钉 | 多窗口、常驻托盘、实时同步 | [窗口体系](/part2-core/07-windows) |
| 知识库 / 笔记 | Notion、Obsidian、语雀 | 离线优先、本地存储、插件生态 | [存储架构](/part2-core/12-storage) |
| 设计 / 创作 | Figma | 重计算下沉 WASM、渲染管线定制 | [性能优化](/part3-engineering/18-performance) |
| AI 助手 | ChatGPT、Claude | 全局快捷键、屏幕捕获、轻壳重 AI | [系统能力](/part2-core/11-system) |
| 安全 / 密码 | 1Password | 沙箱、CSP、安全默认值的最严格落地 | [安全模型](/part2-core/10-security) |
| 录屏 / 媒体 | Loom、Streamlabs | 桌面捕获、性能敏感型负载 | [截屏与屏幕捕获](/part2-core/08-screenshot) |
| 跨领域通用 | 上述全部 | 升级节奏、崩溃治理、包体控制 | [版本策略与升级清单](/appendix/versioning) |

## 从清单到行动：三步调研法

找到对标应用后，别急着读代码，按这个顺序榨干它的公开信息：

1. **看进程结构**：装上对标应用，打开系统进程管理器（macOS 活动监视器 / Windows 任务管理器），数一数它起了几个进程、各自占用多少内存——你会直接看到主进程、GPU 进程、若干渲染进程的真实分布，比任何架构图都直观。
2. **读公开仓库与 changelog**：VS Code、GitHub Desktop、Obsidian 等都有公开仓库；changelog 里高频出现的关键词（内存、崩溃、更新）就是这个领域真正的工程难点清单。
3. **对照本书章节落点**：看到的现象回本书找解释——多进程分布对照[进程模型](/part1-background/04-process-model)，崩溃治理对照[案例库](/cases/01-zoom-white-screen)，内存数字对照[性能优化](/part3-engineering/18-performance)。

选型汇报的组织方式也可以照抄本页结构：先放旗舰表证明生态，再放同领域对标，最后用 QQ NT 四篇信源回答「别人为什么这么选、选完怎么还债」。

## 完整目录：官方 apps 页

本页只收标杆与信源扎实的样本。[官方 apps 目录](https://www.electronjs.org/apps)收录了数百个应用，支持按分类与关键词检索，每条带有仓库或官网链接——找到同领域应用后，直接读它的公开仓库与 changelog 是最高效的选型调研方式。你自己的应用上线后，也可以通过向 [electron/website](https://github.com/electron/website) 仓库提 PR 提交收录。

更多资料入口见[资料 Hub](/hub/resources)。
