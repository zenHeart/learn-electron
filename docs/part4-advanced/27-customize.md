# Electron 定制

> **一句话本质**：「定制 Electron」的正解是分层取舍——绝大多数定制需求止步于配置与运行时 API 层，安全加固要动 Fuses（改二进制），只有极少数团队才应该 fork 源码自己编译；层级越深，能力越强，维护成本也指数级上升。

读完本章你会获得：Fuses 的完整决策框架（每个关键 fuse 防什么攻击）、chromium 开关的三层注入时机、应用层定制手段盘点（协议 / UserAgent / webRequest / 加载顺序）、以及「什么团队才配 fork Electron」的判断标准。

## 心智模型：定制的四层金字塔

```text
        ┌─────────────────────┐
        │ ④ 源码定制（fork 编译）│  ← Chromium 深度魔改，极少数团队
        ├─────────────────────┤
        │ ③ 二进制定制（Fuses）  │  ← 安全加固，改的是 Electron 可执行文件
        ├─────────────────────┤
        │ ② 运行时 API 定制     │  ← protocol / session / webRequest
        ├─────────────────────┤
        │ ① 配置与开关定制       │  ← feature flag / 规则引擎（13 章）
        └─────────────────────┘
   成本与风险自上而下递减；90% 的「定制需求」落在最底下两层
```

收到定制需求的第一反应：先往下问三层「能不能不做」。上一层的每一个选择，都会变成下个季度别人床底的定时炸弹。

一个佐证：本章四层里，①②层的全部手段都能随一次普通发版回滚，③层要重签全量产物，④层要养一支跟随 Chromium 的队伍——回滚半径就是层级差的直观度量。

## 一、Fuses：改 Electron 二进制的安全开关

Fuses 是嵌在 Electron 可执行文件里的运行时开关（[fuse wire](https://www.electronjs.org/docs/latest/tutorial/fuses) 段）。它们默认面向**开发者**的值——发布生产应用前应该逐个翻转。每个 fuse 防的是一个具体攻击/误用场景：

| Fuse | 生产建议 | 防的场景 |
|---|---|---|
| `RunAsNode` | **关** | 环境变量 `ELECTRON_RUN_AS_NODE` 能把你的 exe 变成裸 Node 运行时——攻击者拿到一个合法签名的二进制即可跑任意脚本（签名白名单绕过） |
| `EnableNodeCliInspectArguments` | **关** | `--inspect` 参数让任何人 attach 调试器到你的生产应用，读取/篡改运行时状态 |
| `EnableNodeOptionsEnvironmentVariable` | **关** | `NODE_OPTIONS` 环境变量注入任意 Node 参数，同上 |
| `EnableEmbeddedAsarIntegrityValidation` | **开** | 校验 asar 内容哈希与嵌在二进制里的期望值一致，篡改过文件的应用拒启（需配合签名，见下文坑位） |
| `OnlyLoadAppFromAsar` | **开** | 禁止从 `app/` 目录加载散装代码，强制 asar 单一产物，堵「替换 index.js」类攻击 |
| `EnableCookieEncryption` | **开** | Cookie 用 OS 级密钥库（Keychain / DPAPI / libsecret）加密落盘，而非明文 |
| `grantFileProtocolExtraPrivileges` | **关** | `file://` 页面默认拿不到完整的 `file:` 读写特权；开它等于给本地页面开后门，仅调试期用 |
| `loadBrowserProcessSpecificV8Snapshot` | 按需 | 让主进程加载定制 V8 snapshot（默认渲染进程用快照、主进程不用）；做主进程 JS 环境预热的团队才需要 |

翻转方式（CLI 交互式）：

```bash
npx @electron/fuses --app=./dist/win-unpacked/MyApp.exe
```

或程序化地嵌进 electron-builder 的 afterPack 钩子（CI 里可复现）：

```js
// afterPack.js —— electron-builder 配置 "afterPack": "./afterPack.js"
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses')

exports.default = async (context) => {
  const electronBinary = path.join(context.appOutDir, 'MyApp.exe') // macOS 是 .app 内的可执行文件
  await flipFuses(electronBinary, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.EnableCookieEncryption]: true
  })
}
```

时序必须对：**flip fuses 要发生在签名之前**——asar 完整性的期望值嵌进二进制，二进制变了签名就得重做，顺序反了等于白签。

### 1.1 怎么验证 fuse 真的生效了

flip 命令不报错 ≠ 生效，发布前用两个手动实验闭环：

```bash
# 实验①：RunAsNode 关闭后，这个命令应立即退出而不是进入 Node REPL
ELECTRON_RUN_AS_NODE=1 ./dist/win-unpacked/MyApp.exe    # macOS: MyApp.app/Contents/MacOS/MyApp

# 实验②：inspect 参数关闭后，这个命令应正常启动且不打印 Debugger listening
./MyApp.exe --inspect=9229
```

两个实验都「如常启动、拒绝变形」，fuse 链才算真的焊死。工程化上，electron-forge 用户有现成的 `@electron-forge/plugin-fuses`（构建期声明式翻转），electron-builder 用户走上文 afterPack——别在两条构建链之外手工 flip，不可复现的加固等于没加固。

## 二、Chromium 开关：三层注入时机

Chromium 有上千个运行时开关（GPU 策略、渲染后端、特性开关……全表见[命令行速查](/appendix/cli-reference)）。同一个开关有三条注入路径，区别只在「谁控制、何时生效」：

| 时机 | 手段 | 控制方 | 适用 |
|---|---|---|---|
| 启动前（代码层） | `app.commandLine.appendSwitch()`（必须在 `app.ready` 前） | 你（可按 13 章的规则引擎条件化） | 正道：随版本管理的开关策略 |
| 启动时（命令行层） | 用户快捷方式/脚本给 exe 追加 `--flag` | 用户 / IT 管理员 | 打包后仍可调，排障救急 |
| 环境变量层 | `ELECTRON_` 系列等 | 部署系统 | 少数日志/代理类变量 |

```js
// 主进程入口最顶端，app.ready 之前
const { app } = require('electron')
const rules = loadGpuRules()          // 13 章：远程下发的规则引擎
if (rules.disableGpu) {
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('disable-software-rasterizer')
}
```

排障与性能场景里高频出现的几个开关（完整表见[速查附录](/appendix/cli-reference)）：

```text
--disable-gpu / --disable-software-rasterizer   渲染异常的自救兜底
--ignore-gpu-blocklist                          放开 GPU 黑名单（新硬件跑老 Chromium）
--force-color-profile=srgb                      截图/取色色偏修正
--autoplay-policy=no-user-gesture-required      允许自动播放（媒体类应用）
--proxy-server=...                              指定代理（配合 session.setProxy）
```

关键认知：代码层注入**早于一切**——它发生在 Chromium 初始化之前，所以能影响 GPU 进程这类早期行为；这也是「渲染 bug 用开关自救」必须在启动同步读缓存的原因（详见 13 章的四条纪律）。另注意三层会叠加：用户在快捷方式加的 `--flag` 与你代码里的 `appendSwitch` 同时存在时，后注入的值可能覆盖你的策略——涉及安全或渲染策略的开关，发布前要在「带用户参数启动」的场景下回归一遍。

## 三、应用层定制手段盘点

不动二进制能做的定制，按侵入度排列：

### 3.1 自有 URL scheme

`protocol.registerSchemesAsPrivileged` + `protocol.handle` 注册 `myapp://`，让网页/系统唤起你的应用、让应用内静态资源走自有协议——完整做法见[系统章节](/part2-core/11-system)。

### 3.2 自定义 UserAgent

```js
// 全局（所有窗口）：
app.setUserAgent('MyApp/2.1 (Electron; Windows; x64)')
// 或只对某个 session（比如内嵌三方页面时隔离身份）：
session.setUserAgent('MyApp/2.1 (client)')
```

价值不在「伪装」，在于让服务端能识别客户端与版本做兼容决策（配合 25 章的能力位）。注意：UA 改了之后，`navigator.userAgent` 与你发请求的 UA 是否一致，会影响服务端反爬与统计口径，发布前对齐一次。

### 3.3 请求统一改写：webRequest

```js
// 给本应用全部出站请求统一注入身份头——业务代码零感知
session.defaultSession.webRequest.onBeforeSendHeaders(
  { urls: ['https://*.mycompany.com/*'] },   // URL 模式过滤，别全量拦
  (details, callback) => {
    details.requestHeaders['X-Client-Version'] = app.getVersion()
    callback({ requestHeaders: details.requestHeaders })
  }
)
```

这是「不侵入业务代码做统一网关」的钩子：注入头、改写 URL、拦截追踪器都在这层做，[WebRequest API](https://www.electronjs.org/docs/latest/api/web-request)。做「壳内 Web 与壳协商」的请求标记（25 章能力位的服务端对账）也走这里。

### 3.4 主进程 patch 加载顺序

控制「什么代码先于什么代码执行」——在加载任何业务模块前先 patch 全局 console、安装崩溃钩子、冻结配置缓存：

```js
// main.js 第一行：先跑完全部 bootstrap，再放行业务
require('./bootstrap-console')    // 统一 console 格式并接观测（23 章）
require('./bootstrap-config')     // 同步读缓存并 freeze 配置对象
require('./bootstrap-patch')      // 给三方库打运行时补丁（而非 fork 源码）
require('./app')                  // 业务入口最后启动
```

这是「用加载顺序做 AOP」：对三方库的运行时补丁（修一个函数行为、绕一个 bug）写成 patch 模块在 bootstrap 阶段生效，比改三方库源码干净得多——源码不改，升级不停。

## 四、真正的源码定制：fork 并编译 Electron

真走到这一层的标志是：你要改的东西在 Chromium 内部（私有编解码、深度安全策略、特殊硬件适配），Fuses 和开关都够不着。官方路径是用 [build-tools](https://github.com/electron/build-tools)（`evm`）拉代码、GN 配置、按平台编译——见官方 [Build Instructions (GN)](https://www.electronjs.org/docs/latest/development/build-instructions-gn)。

判断标准很朴素：**你的团队是否养得起一个「Chromium 跟随」小组？** 每次 Electron 跟进新 Chromium（约每 4-8 周一个稳定版节奏），你的 fork 都要 rebase 全部定制补丁、重新验证、重新跑全量测试。历史经验：除非你有万级以上付费用户在依赖某个 Chromium 级特性，否则 fork 的维护成本会吃掉全部收益。**绝大多数团队的正解是「规则引擎 + 开关」**（13 章）——它能在不改一行 Electron 代码的前提下，动态改变渲染与网络行为。

## 五、定制决策清单

收到任何「定制 Electron」需求，按序走一遍，落在第一行命中的层级上：

| 问题 | 命中 → 层级 | 对应手段 |
|---|---|---|
| 只是行为/外观不同？ | ① 配置 | feature flag、主题、规则引擎（13 章） |
| 要改网络、协议、请求行为？ | ② 运行时 API | protocol / webRequest / UserAgent（本节三、11 章） |
| 是安全加固/防篡改？ | ③ Fuses | flip fuses + asar 完整性（本节一） |
| 要改 Chromium 内部行为？ | ④ 源码 | evm + GN（本节四）——先做完上面的灵魂拷问 |

三类最常见的错配：把「多品牌」当定制（应为多身份打包）；把「改 UA/加请求头」当需求做进业务代码（应在 webRequest 层）；把「关 inspect」寄托在签名上（应为 fuse——签名防的是文件篡改，fuse 防的是运行时开关）。

::: exp 实战经验
定制的性价比判断题：「客户要求换个名字和图标」，这不是定制，是**多身份打包**——用 electron-builder 的多配置矩阵（不同 `appId` / `productName` / 图标资源目录 / extraResources）产出 N 个安装包，一份代码，产品化叫法是 white-label。判断口诀：需求落在「资产与配置不同」→ 多身份打包；落在「行为不同」→ feature flag + 规则引擎；只有落在「Chromium 能力本身不同」→ 才轮到 fork。三次反问下来，95% 的「源码定制」需求会消失。
:::

::: pitfall 坑位警报
两个大坑，都是「改了 A 忘了 B」：

**① Fuses + asar integrity 的签名链**。开了 `EnableEmbeddedAsarIntegrityValidation` 后，任何对 asar 的改动（包括你后续的热更新没走重签名流程）都会让应用直接拒启——这是**防护生效的表现**，不是 bug，但排查起来像灵异事件。配套纪律：asar 产物、flip fuses、签名三步必须一条 CI 流水线产出，禁止本地手工补签。

**② fork Electron 的 rebase 车祸**。fork 的第一天就要接受：从此 Chromium 的每个安全补丁、每个 Electron 稳定版，都变成你的「待办清单 + 回归测试」。见过太多团队为一个小特性 fork，一年后被三百个未合入的安全 CVE 卡死在旧版。fork 前先问：这个特性值得每年花多少人周去养？
:::

## 延伸阅读

- [Electron Fuses 官方教程](https://www.electronjs.org/docs/latest/tutorial/fuses) —— 全部 fuse 的权威定义
- [@electron/fuses](https://github.com/electron/fuses) —— flip 工具与程序化 API
- [Build Instructions (GN)](https://www.electronjs.org/docs/latest/development/build-instructions-gn) —— 编译 Electron 本体
- [electron/build-tools](https://github.com/electron/build-tools) —— `evm` 构建管理器
- [Command Line Switches](https://www.electronjs.org/docs/latest/api/command-line-switches) —— Chromium/Chromium 开关注入 API
- 本书[命令行速查附录](/appendix/cli-reference)与[配置章节](/part2-core/13-config) —— 开关策略的落地位置
