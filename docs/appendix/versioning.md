# 版本策略与升级清单

> 升级 Electron 不是「改个版本号重装依赖」，而是一次小型交付：有动机、有清单、有灰度、有回滚。本页把官方版本策略压成一页决策速查，再给一套从生产实践泛化的升级流程。

## 版本语义：先看懂版本号在告诉你什么

Electron 从 2.0 起遵循 [SemVer](https://semver.org/)，但每一档的含义和普通 npm 包不一样——**Chromium 与 Node 的版本变化也计入**：

| 变更类型 | 版本档位 |
| --- | --- |
| Electron 破坏性 API 变更 | major |
| Node.js 大版本更新 | major |
| Chromium 版本更新 | major |
| Electron 非破坏性 API 新增 | minor |
| Node.js / Chromium 的 bug 修复回移 | patch |

两个节奏事实，决定你的升级压力：

- **约每 8 周发布一个新 major**，与 Chromium 稳定版节奏对齐（4 周 alpha + 4 周 beta 后转 stable，见[官方时间线](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)）。
- **官方只维护最新的 3 个 major 支持线**（每条 major 一条 `N-x-y` 稳定分支，只回移安全与稳定性修复）。掉出支持线的版本，连 Chromium 漏洞修复都拿不到——各版本的 EOL 日期可在 [Release Schedule](https://releases.electronjs.org/schedule) 查到。

### 读懂「版本三件套」

一个 Electron 版本号背后是三个组件版本的组合，升级影响面要从三件套分别看：

| 组件 | 升级影响落在哪 | 典型受害场景 |
| --- | --- | --- |
| Chromium | 渲染行为、CSS / API 兼容性、GPU 驱动适配 | 页面样式漂移、显卡黑名单变化引发崩溃 |
| Node.js | 主进程 API、ABI（原生模块必重编） | 原生模块加载失败、`fs` 行为差异 |
| V8 | JS 语义与性能特征 | 极端依赖 JIT 行为的代码性能回退 |

查询入口：[releases.electronjs.org](https://releases.electronjs.org/) 每个版本旁直接标注所对应的 Chromium 与 Node 版本；不写死在本文，以查询结果为准。

### 稳定分支与安全修复的回移机制

理解「patch 是怎么到你手上的」，才能判断「等修复」还是「先绕过」：

| 机制 | 规则 | 对你的意义 |
| --- | --- | --- |
| 稳定分支命名 | 每个 major 一条 `N-x-y` 分支（如 `32-x-y`），只接受安全 / 稳定性回移 | 同 major 内升 patch 是低风险动作 |
| 回移（backport） | 修复先合 `main`，再由维护者 / 社区 PR 回移到支持线分支 | 严重 bug 可以主动提回移 PR，不必干等 |
| 分支永不合回 | 稳定分支不再回流 `main` | 升级窗口拖太久，跨 major 成本是跳不过去的 |

另注：`main` 分支本身的每夜构建发布在 npm 的 `electron-nightly` 包，想提前验证某修复是否已进主线时用它。

## 版本选择决策表

| 项目状态 | 建议 | 理由 |
| --- | --- | --- |
| 新项目 | 直接上最新稳定 major | 支持窗口最长，避免起步就欠升级债 |
| 存量项目（落后 1–2 个 major） | 每季度评估一次升级窗口，底线是别掉出 3 条支持线 | 掉线后安全修复要自己背，被动紧急升级最贵 |
| 有原生 SDK 锁死 ABI（音视频 / 加密狗等） | 跟随 SDK 厂商的版本认证节奏，同时盯支持线 EOL 倒计时 | 大版本升级 = Node ABI 变化 = 原生模块全部重新验证 |

## 升级前检查清单

逐项打勾再动手，缺一项都可能变成线上事故：

- [ ] 通读目标版本起的 [breaking-changes](https://www.electronjs.org/docs/latest/breaking-changes) 全文，逐条对照自己用到的 API
- [ ] 锁定目标版本并在 lockfile 固化，别让 `^` 波浪符在升级期间偷偷漂移
- [ ] 废弃 API 扫描：以弃用告警模式启动并跑完主流程，让每次调用打出调用栈

  ```bash
  # --trace-deprecation 会让废弃 API 的调用栈直接打到控制台
  npx electron --trace-deprecation .
  ```

- [ ] 原生模块全量重编（major 升级必然伴随 Node ABI 变化）：`npx @electron/rebuild -f`
- [ ] 配套工具链同步：Forge / electron-builder / 各 `@electron/*` 包升到声明支持目标版本的档位
- [ ] grep 扫描安全相关配置的历史遗留：`nodeIntegration`、`contextIsolation`、`webSecurity`——新版本的默认值可能反转
- [ ] 多窗口与长时运行回归：反复开关窗口、挂机 24 小时看内存曲线（参考[多窗口关闭崩溃案例](/cases/04-multi-window-crash)）
- [ ] 崩溃率基线：升级前先记录当前崩溃率，否则升级后没法对比
- [ ] 灰度路径：1% → 10% → 50% → 全量，每档至少观察一个完整使用周期
- [ ] 回滚预案：旧版安装包可下发，更新通道可回切

## 升级工作项分解

| 工作项 | 做什么 | 风险点 |
| --- | --- | --- |
| 主进程废弃 API 迁移 | 对照 breaking-changes 逐条替换 | 部分变更不报错、只变语义（如返回值从同步改异步） |
| preload 迁移 | contextIsolation / sandbox 默认值变化的适配 | 报错延迟到运行时才爆，测试覆盖不到就上线 |
| remote 类库处理 | Electron 14 起 `remote` 移出核心：换 `@electron/remote`，或彻底去 remote 化 | remote 是历史崩溃大户，建议借升级一并清退 |
| 原生 SDK 配套 | ABI 重编 + SDK 厂商新版认证 | SDK 不支持新 ABI 时整次升级被迫中止，提前问厂商 |
| 构建链适配 | 打包器、签名工具、CI 镜像联动升级 | 「只在本机好使」的构建脚本在 CI 上现原形 |
| 签名链回归 | macOS 签名 + 公证、Windows 签名在 CI 全链路走一遍 | 硬件令牌 / 云签名服务在 CI 环境的可用性 |

::: exp
升级动机要先写清楚，动机决定紧迫度，紧迫度决定排期。三类动机：

- **安全**（Chromium 漏洞修复）：最高优先级。有在野利用的漏洞按天计，这类升级没有「等下个迭代」的选项。
- **崩溃率**（特定版本已知 bug）：先去 [GitHub issues](https://github.com/electron/electron/issues) 确认是不是已知问题——很多时候一个 patch 版本就修了，不必跳 major。
- **功能**（需要新 API）：最低紧迫度，搭版本窗口车即可。

真的「升不动」时（原生 SDK 停更、认证周期没到），活路是**锁旧版本 + 自建规则兜底**：把旧版本的风险面收敛成可控规则——例如按机型差异下发命令行开关（GPU 异常机器禁用硬件加速），用崩溃监控盯住规则命中量，给自己争取到下一个升级窗口。规则引擎的思路见[性能优化](/part3-engineering/18-performance)的 GPU 适配部分。
:::

## 官方参考

- [Electron Timelines](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)：各 major 的 alpha / beta / stable / 支持截止日期
- [Release Schedule](https://releases.electronjs.org/schedule)：发布时间表的可视化日历
- [Electron Versioning](https://www.electronjs.org/docs/latest/tutorial/electron-versioning)：SemVer 映射与稳定分支机制的权威说明
- [Breaking Changes](https://www.electronjs.org/docs/latest/breaking-changes)：每个版本的破坏性变更清单——升级前的第一阅读材料
