# 官方资源索引

> 只收「值得放进收藏夹」的入口，每条注明什么场景打开它。链接以官方站点为准，工具的取舍理由见对应正文章节。
>
> 使用原则：外链会随官方站点改版而变动，打不开时优先从 [官方文档](https://www.electronjs.org/docs/latest) 首页侧栏重新定位，而不是依赖搜索引擎的缓存结果。

## 官方入口

| 名称 | 地址 | 什么时候用 |
| --- | --- | --- |
| 官方文档 | <https://www.electronjs.org/docs/latest> | API 细节与教程的第一信源，写代码前先对一遍 |
| Quick Start 教程 | <https://www.electronjs.org/docs/latest/quick-start> | 第一次上手：官方最小可运行示例，[路线图第 1 周](/appendix/roadmap)的起点 |
| 版本发布站 | <https://releases.electronjs.org/> | 查各版本对应的 Chromium / Node 版本、下载与版本支持线 |
| 发布时间表 | <https://releases.electronjs.org/schedule> | 规划升级窗口：看各 major 的 alpha / stable / EOL 日期 |
| Electron Fiddle | <https://www.electronjs.org/fiddle> | 沙盒实验：不建项目就试 API，可切换 Electron 版本、导出 Gist 复现 bug |
| 官方博客 | <https://www.electronjs.org/blog> | 每个 major 发布公告与重要变更解读，升级前必读对应篇 |
| GitHub Issues | <https://github.com/electron/electron/issues> | 疑难杂症先搜这里——「只有我遇到吗」的答案通常在 issue 区 |
| Electron 主仓库 | <https://github.com/electron/electron> | 读源码、提 PR、追某个修复进了哪个分支 |
| 社区（含 Discord） | <https://www.electronjs.org/community> | 官方 Discord 等社区入口，实时提问与案例交流 |

## 工具链

| 名称 | 地址 | 什么时候用 |
| --- | --- | --- |
| Electron Forge | <https://www.electronforge.io/> | 官方一体化工具链：脚手架、打包、签名、更新一条龙（[打包](/guide/11-packaging)） |
| electron-builder | <https://www.electron.build/> | 社区主流打包器：安装包格式与自动更新配置最丰富 |
| @electron/packager | <https://github.com/electron/packager> | 只想把应用打成可执行目录、安装格式自己另做时用（Forge 的底层之一） |
| @electron/rebuild | <https://github.com/electron/rebuild> | 原生模块按当前 Electron 的 ABI 重编，装完原生依赖必跑（[原生扩展](/guide/10-native)） |
| @electron/windows-sign | <https://github.com/electron/windows-sign> | Windows 签名工具：支持 EV 证书、云 HSM（DigiCert KeyLocker / AWS CloudHSM 等）场景（[签名](/guide/12-signing)） |
| @electron/osx-sign | <https://github.com/electron/osx-sign> | macOS 签名与公证的底层工具（Forge / builder 内部也用它，[签名](/guide/12-signing)） |
| electron-devtools-installer | <https://www.npmjs.com/package/electron-devtools-installer> | 装 React/Vue 等 DevTools 扩展；注意维护已不活跃，能用 `session.loadExtension` 手动加载就优先手动（见[官方教程](https://www.electronjs.org/docs/latest/tutorial/devtools-extension)） |
| Electron Fiddle | <https://www.electronjs.org/fiddle> | 复现官方 issue 时的最小成本载体：导出 Gist 附在 issue 里 |

## 调试分析

| 名称 | 地址 | 什么时候用 |
| --- | --- | --- |
| Perfetto UI | <https://ui.perfetto.dev/> | 打开 trace 文件看时间轴：启动耗时、卡顿归因（[调试体系](/guide/15-debugging)） |
| NetLog Viewer | <https://netlog-viewer.appspot.com/> | 拖入 `--log-net-log` 产出的文件，逐事件查网络请求（[调试体系](/guide/15-debugging)） |
| chrome://gpu | 应用地址栏直接输入 | 看 GPU 状态与禁用项清单：显卡支持哪些特性一目了然（[性能优化](/guide/16-performance)） |
| CDP 协议文档 | <https://chromedevtools.github.io/devtools-protocol/> | 写自动化注入 / 自定义调试工具时查协议字段 |
| Sentry（Electron SDK） | <https://docs.sentry.io/platforms/javascript/guides/electron/> · [GitHub](https://github.com/getsentry/sentry-electron) | 不想自建崩溃收集时的 SaaS 方案，minidump 符号化一条龙（[监控](/guide/18-observability)） |

## 深入底层

| 名称 | 地址 | 什么时候用 |
| --- | --- | --- |
| Chromium 源码浏览器 | <https://source.chromium.org/> | Chromium 全量源码检索的总入口 |
| Chromium trace_event 源码 | <https://source.chromium.org/chromium/chromium/src/+/main:base/trace_event/> | 追踪打点的原始定义，看懂 trace 输出里的字段含义 |
| Chromium 开关与特性清单 | <https://source.chromium.org/chromium/chromium/src/+/main:base/base_switches.cc> | 确认一个命令行开关在本版本 Chromium 里真实存在（配合[速查页三步法](/appendix/cli-reference)） |
| V8 文档 | <https://v8.dev/> | JS 引擎层的问题：GC、`--js-flags`、内存语义 |
| Mojo 文档 | <https://chromium.googlesource.com/chromium/src/+/main/mojo/README.md> | 理解 Chromium 进程间通信地基，读懂进程模型的下一层 |
| Chromium GPU 配置源码 | <https://chromium.googlesource.com/chromium/src/+/main/gpu/config/> | GPU 控制列表（黑名单 / workaround）的原始定义，显卡适配问题查到根 |

## 本站引用过的深度资料

<!-- 深度资料区：占位。正文章节引用的深度分析文章与讲义，由主仓库统一维护后在此登记。
     登记格式：| 资料名 | 来源链接 | 关联章节 | 一句话说明何时读 |
     登记门槛：正文确实引用过 + 链接可公开访问 + 无内部信息。
     注意：登记前先确认链接可公开访问、无内部信息。 -->
