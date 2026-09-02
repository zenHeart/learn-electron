# 术语表

> 按主题分组的一句话解释，每个术语链到本站对应章节。看不懂某个词时来这里查，再跳正文深挖。

## 进程类

| 术语 | 一句话解释 |
| --- | --- |
| [主进程](/part1-background/04-process-model) | 应用唯一的管理进程：创建窗口、调度生命周期、持有系统能力，是 Node.js 环境的大管家 |
| [渲染进程](/part1-background/04-process-model) | 每个窗口 / 页面对应的 Chromium 进程，只负责画界面，默认不给 Node 能力 |
| [GPU 进程](/part1-background/04-process-model) | 全应用共享的一个进程，负责合成所有窗口的画面；它崩溃就是你看到的「GPU 崩溃」 |
| [网络服务进程](/part1-background/04-process-model) | 独立出来的 Chromium 网络进程，所有 HTTP(S) 请求实际发生的地方，崩溃不影响页面 |
| [Utility Process](/part1-background/04-process-model) | Electron 提供的类子进程服务：像渲染进程一样托管 Node 环境，但不含页面，适合托管原生服务的胶合层 |
| [进程沙箱](/part2-core/10-security) | Chromium 给渲染进程套的权限隔离层：默认无 Node、无文件系统直访，页面被攻破也难横向扩散 |

## 打包类

| 术语 | 一句话解释 |
| --- | --- |
| [asar](/part3-engineering/19-packaging) | 把整个应用源码打成单文件的归档格式，Electron 能直接从中读取，兼顾分发与轻度源码保护 |
| [asar unpack](/part3-engineering/19-packaging) | 把指定文件（如 `.node` 原生模块）从 asar 里解出来单独放置，因为它们必须以真实文件存在才能被加载 |
| [dmg](/part3-engineering/19-packaging) | macOS 的磁盘镜像分发格式，用户拖图标进 Applications 完成安装 |
| [NSIS](/part3-engineering/19-packaging) | Windows 开源安装器框架，Electron Windows 安装包的主流选择之一 |
| [AppImage](/part3-engineering/19-packaging) | Linux 的「下载即运行」格式，免安装、单文件 |
| [Squirrel](/part3-engineering/19-packaging) | 一套安装 + 更新框架（Windows/macOS 各一版），安装器与增量更新二合一 |
| [通用二进制](/part3-engineering/19-packaging) | macOS 上同时包含 x64 与 arm64 两种架构的可执行文件，一个包适配 Intel 与 Apple Silicon |

## 签名类

| 术语 | 一句话解释 |
| --- | --- |
| [Authenticode](/part3-engineering/20-signing) | Windows 的代码签名体系，签了名的 exe 才能证明「这个文件是我发的、没被改过」 |
| [SmartScreen](/part3-engineering/20-signing) | Windows 下载保护：没签名或信誉不足的安装包会先吃「更多信息 → 仍要运行」警告 |
| [公证 notarization](/part3-engineering/20-signing) | macOS 的附加流程：把签名后的包交给 Apple 云端扫描，不做公证的应用会被 Gatekeeper 拦截 |
| [Hardened Runtime](/part3-engineering/20-signing) | macOS 的运行时加固：签名时开启后系统限制 JIT 注入等能力，公证的前置要求 |
| [U 盾 / HSM](/part3-engineering/20-signing) | 硬件安全模块：EV 证书私钥不出硬件，签名必须在插着它的机器（或云 HSM）上完成 |
| [时间戳](/part3-engineering/20-signing) | 签名时向时间戳服务器盖的「何时签的」凭证，保证证书过期后旧包仍然有效 |

## 更新类

| 术语 | 一句话解释 |
| --- | --- |
| [全量更新](/part3-engineering/21-releases-updates) | 下载完整安装包整体替换，实现简单，代价是每次都拉几十上百 MB |
| [增量更新（bsdiff）](/part3-engineering/21-releases-updates) | 只下载新旧版本差异补丁（bsdiff 算法生成），客户端本地合成新文件，体积可缩到全量的几十分之一 |
| [热更新](/part3-engineering/21-releases-updates) | 不重启进程、只替换渲染层资源（页面 / JS）就生效的更新方式，快但覆盖面有限 |
| [Squirrel 更新流](/part3-engineering/21-releases-updates) | Squirrel 系的「后台静默下载 → 下次重启自动换版本」机制 |
| [electron-updater](/part3-engineering/21-releases-updates) | electron-builder 配套的更新客户端库，支持差分更新与多更新源 |

## 调试类

| 术语 | 一句话解释 |
| --- | --- |
| [CDP](/part3-engineering/16-debugging) | Chrome DevTools Protocol：DevTools 与自动化工具（Playwright 等）和 Chromium 说的那套协议 |
| [trace](/part3-engineering/16-debugging) | Chromium 全链路打点记录（谁在哪个线程耗了多少微秒），性能分析的第一手数据 |
| [Perfetto](/part3-engineering/16-debugging) | Google 的 trace 可视化引擎，把 trace 文件展开成时间轴让你逐线程看 |
| [NetLog](/part3-engineering/16-debugging) | Chromium 网络层事件日志，查「请求到底发没发、卡在哪一步」的证据链 |
| [minidump](/part3-engineering/23-observability) | 崩溃瞬间的进程内存快照文件，符号化后能还原出崩溃现场调用栈 |
| [Crashpad](/part3-engineering/23-observability) | Chromium 系的崩溃捕获器：进程崩了由它落盘 minidump 并上报，Electron 内置 |
| [符号化](/part3-engineering/23-observability) | 把 minidump 里的一串内存地址映射回「哪个文件哪个函数第几行」，没有它崩溃报告只是天书 |

## 底层类

| 术语 | 一句话解释 |
| --- | --- |
| [Chromium](/part1-background/01-what-is-electron) | Electron 的渲染引擎本体，Electron 每个 major 版本对应一个 Chromium 大版本 |
| [V8](/part1-background/01-what-is-electron) | 跑 JS 的引擎，主进程和渲染进程里的 JavaScript 都由它执行 |
| [Node.js](/part1-background/01-what-is-electron) | 主进程里的服务器级运行时，提供 fs / net / child_process 这些系统能力 |
| [ABI](/part4-advanced/25-sdk-integration) | 二进制接口版本号——Electron 升 major 后 ABI 变化，所有原生模块必须重编 |
| [N-API](/part4-advanced/25-sdk-integration) | Node 的稳定原生接口：按它写的原生模块跨 Node 版本免重编，选原生依赖时优先认它 |
| [Mojo](/part1-background/04-process-model) | Chromium 内部进程间通信的底层框架，Electron 进程模型的地基 |
| [ANGLE](/part3-engineering/18-performance) | Chromium 的图形抽象层：把 OpenGL ES 调用翻译到 D3D11 / Metal / Vulkan 等后端，`--use-angle` 切的就是它 |
| [结构化克隆](/part2-core/09-ipc) | IPC 消息的默认序列化算法（比 JSON 强，支持循环引用等），决定哪些对象能直接过 IPC |
| [preload](/part2-core/09-ipc) | 在渲染进程页面脚本之前运行的桥接脚本：唯一被授权暴露主进程能力的窗口 |
| [contextIsolation](/part2-core/10-security) | 把 preload 与页面脚本隔离在不同上下文的开关：Electron 推荐的安全基线之一 |

## 相关附录

- 命令行开关速查：[命令行与环境变量速查](/appendix/cli-reference)
- 版本怎么选怎么升：[版本策略与升级清单](/appendix/versioning)
- 想读官方一手资料：[官方资源索引](/hub/resources)
