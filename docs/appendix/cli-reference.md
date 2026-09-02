# 命令行与环境变量速查

> 排查问题的第一反应应该是「有没有现成开关」，而不是改代码。本页按用途分组速查：开关 | 作用 | 典型用法。开关细节以官方 [Supported Command Line Switches](https://www.electronjs.org/docs/latest/api/command-line-switches) 与 [Environment Variables](https://www.electronjs.org/docs/latest/api/environment-variables) 为准。

## 调试类

| 开关 | 作用 | 典型用法 |
| --- | --- | --- |
| `--inspect[=[host:]port]` | 开主进程 Node 调试器，默认 `127.0.0.1:9229` | `electron --inspect=9229 .` 后用 Chrome/VS Code 附加 |
| `--inspect-brk[=[host:]port]` | 同上，但在用户脚本首行暂停（调试启动早期逻辑） | `electron --inspect-brk .` |
| `--remote-debugging-port=port` | 开 CDP 远程调试（渲染进程 DevTools / 自动化注入） | `electron --remote-debugging-port=9222 .`，浏览器打开 `chrome://inspect` |
| `--enable-logging[=file]` | Chromium 内部日志打到 stderr 或文件 | Windows 子进程日志只能落文件：`--enable-logging=file --log-file=C:\logs\app.log` |
| `--log-net-log=path` | 记录全部网络事件为 NetLog 文件 | `electron --log-net-log=net.json .`，拖入 [NetLog Viewer](https://netlog-viewer.appspot.com/) 分析 |
| `--trace-config-file=path` | 按 JSON 配置文件采集系统 trace | 性能与启动分析用，产物导入 [Perfetto](https://ui.perfetto.dev/) 看（见[调试体系](/guide/15-debugging)） |
| `--show-fps-counter` | 页面角落显示合成器帧率计数 | 肉眼快速确认掉帧是否存在 |

## GPU / 渲染类

| 开关 | 作用 | 典型用法 |
| --- | --- | --- |
| `--disable-gpu` | 完全禁用 GPU 加速 | GPU 崩溃排查的第一步对照实验（[GPU 崩溃五步分析法](/guide/cases/02-gpu-crash)） |
| `--disable-gpu-compositing` | 保留 GPU 光栅化，仅合成走软件 | 区分「绘制崩」还是「合成崩」 |
| `--use-angle=<backend>` | 指定 ANGLE 图形后端 | `--use-angle=swiftshader` 强制软件渲染；`--use-angle=d3d11` 锁 Windows 后端 |
| `--disable-features=A,B` | 按名禁用 Chromium 特性 | `--disable-features=SpareRendererForSitePerProcess` |
| `--enable-features=A,B` | 按名启用 Chromium 特性 | 新特性灰度验证；特性名区分大小写，写错不报错 |
| `--disable-direct-composition-video-overlays` | 禁用 Windows DirectComposition 视频叠加 | 视频花屏 / 绿屏 / 黑块时对照 |
| `--enable-gpu-benchmarking` | GPU 基准模式（供自动化读帧率） | 配合测试脚本量化渲染性能 |
| `--force_high_performance_gpu` / `--force_low_power_gpu` | 双显卡机器强制独显 / 核显 | 复现「本机正常、用户机器异常」的显卡差异 |

## 诊断类

| 开关 | 作用 | 典型用法 |
| --- | --- | --- |
| `--no-sandbox` | 关闭 Chromium 沙箱 | 仅限测试对照定位沙箱兼容问题；生产禁用属于安全事故 |
| `--disable-dev-shm-usage` | `/dev/shm` 改用 `/tmp` | Linux 容器 / CI 里渲染崩溃的标配解法 |
| `--ignore-certificate-errors` | 忽略证书错误 | 仅本地抓包调试（配合代理），绝不能进生产 |

::: pitfall
想反向「强制全沙箱」没有 `--enable-sandbox` 这个开关——正确做法是主进程调用 `app.enableSandbox()` 或逐窗口设 `webPreferences.sandbox: true`。别在命令行里找不存在的开关。
:::

## 网络与代理类

排查「应用内请求不通 / 被代理劫持」的标准工具组（抓包联调时最常用）：

| 开关 | 作用 | 典型用法 |
| --- | --- | --- |
| `--proxy-server=address:port` | 强制走指定代理，覆盖系统设置 | `--proxy-server=127.0.0.1:8888` 配合抓包工具 |
| `--proxy-pac-url=url` | 使用指定 PAC 脚本 | 复现企业网络 PAC 分流策略 |
| `--proxy-bypass-list=hosts` | 指定 host 不走代理（分号分隔） | `--proxy-bypass-list='<local>;*.internal.example'` |
| `--no-proxy-server` | 完全禁用代理直连 | 排除代理变量，定位「代理引起的失败」 |
| `--host-resolver-rules=rules` | 重写域名解析 | `--host-resolver-rules='MAP test.example 127.0.0.1:3000'` 本地联调 |
| `--ignore-certificate-errors` | 忽略证书错误（见诊断类警示） | 抓包工具自签证书时的调试搭配 |

## Node.js / V8 类

| 开关 | 作用 | 典型用法 |
| --- | --- | --- |
| `--trace-deprecation` | 废弃 API 打印调用栈 | 升级前扫描（见[版本策略](/appendix/versioning)的检查清单） |
| `--throw-deprecation` | 废弃 API 直接抛错 | 想让废弃调用在 CI 里硬失败时用 |
| `--no-deprecation` | 静默废弃警告 | 已知遗留、临时降噪 |
| `--js-flags=<flags>` | 透传参数给 V8 | `--js-flags="--trace-opt --trace-deopt"` 看 JIT 优化；清单用 `--js-flags="--help"` 查 |

## 环境变量

| 变量 | 作用 | 典型用法 |
| --- | --- | --- |
| `ELECTRON_RUN_AS_NODE` | 以纯 Node.js 进程启动（无 Chromium） | `ELECTRON_RUN_AS_NODE=1 electron script.js`，用 Electron 二进制跑 Node 脚本 |
| `NODE_OPTIONS` | 传 Node 选项子集（受 fuse 限制，打包后默认忽略） | `NODE_OPTIONS="--max-old-space-size=4096" electron .` 调大主进程堆 |
| `ELECTRON_ENABLE_LOGGING` | 等价 `--enable-logging` | 不改启动命令快速拿日志：`ELECTRON_ENABLE_LOGGING=true electron .` |
| `ELECTRON_NO_ATTACH_CONSOLE`（Windows） | 不附加到当前控制台 | Windows 下双击启动时避免控制台闪出 |
| `ELECTRON_OVERRIDE_DIST_PATH` | 让 `electron` 命令用指定构建产物 | 联调自编译 / 特定版本 Electron：`ELECTRON_OVERRIDE_DIST_PATH=./electron-out electron .` |
| `ELECTRON_LOG_FILE` | 指定 Chromium 日志文件路径 | 等价 `--log-file` |
| `ELECTRON_ENABLE_STACK_DUMPING` | 崩溃时打印堆栈到控制台 | 与 `crashReporter` 互斥，二选一 |
| `ELECTRON_NO_ASAR` | 子进程中禁用 asar 支持 | 排查 asar 内文件被第三方工具读不了的问题 |

## 代码内控制的四种方式

| 方式 | 谁消费 | 适合传什么 | 关键注意 |
| --- | --- | --- | --- |
| 命令行直传 | 启动器 / 快捷方式 | 临时诊断，不动代码 | 打包后的应用可在快捷方式目标后追加开关 |
| `app.commandLine.appendSwitch()` | Chromium / Electron 内置开关 | `--key=value` 形式的内置 flag | 必须在 `app` 的 `ready` 事件**之前**调用 |
| `app.commandLine.appendArgument()` | 原样追加任意参数 | 自定义参数（如 `--my-flag`） | 与 appendSwitch 的区别：不做内置开关解析，适合自定义旗标 |
| `webPreferences.additionalArguments` | 该窗口渲染进程的 `process.argv` | 主进程 → 渲染进程的启动期参数 | 在窗口创建时指定，preload 里解析（见下） |

渲染进程解析自定义参数的完整链路：

```js
// 主进程：创建窗口时注入自定义参数
const win = new BrowserWindow({
  webPreferences: {
    // 这些字符串会出现在该窗口渲染进程的 process.argv 里
    additionalArguments: ['--app-env=dev'],
    preload: path.join(__dirname, 'preload.js')
  }
})

// preload.js：解析主进程注入的参数
const env = process.argv
  .find((arg) => arg.startsWith('--app-env='))
  ?.split('=')[1] // 'dev'
```

::: pitfall
`appendSwitch` 写在 `app.whenReady()` 之后是最高频的「开关不生效」原因——此时 Chromium 已经初始化完毕，后加的开关没人消费。所有 `app.commandLine.*` 调用放在主进程入口文件最顶部。
:::

## 一个开关不生效时：三步查证法

::: exp
生产实践沉淀的定位路径，对应「版本不支持 / 写法错误 / 时机太晚」三种根因：

1. **对版本**：到 [releases.electronjs.org](https://releases.electronjs.org/) 查你所用 Electron 内嵌的 Chromium 大版本号。Chromium 开关随版本增删，拿最新 Chrome 的开关表套老版本 Electron，天然对不上。
2. **对源码**：到 Chromium 源码确认开关真实存在——通用开关看 [`base/base_switches.cc`](https://source.chromium.org/chromium/chromium/src/+/main:base/base_switches.cc)，特性开关（`--enable-features` 系列）的定义分散在各模块的 `*_features.cc`，全量清单参考 [`chrome/browser/flag-metadata.json`](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/flag-metadata.json)。Electron 侧的用法可以搜 [electron 仓库 spec/ 测试目录](https://github.com/electron/electron/tree/main/spec)里同一开关怎么传参。
3. **对时机**：确认调用发生在 Chromium 消费该开关之前——`appendSwitch` 必须早于 `ready`；GPU 类开关必须早于第一个窗口创建。

三步走完，剩下的就是要么换版本、要么改写法、要么挪时机。完整案例见[命令行开关不生效](/guide/cases/07-flag-not-working)。
:::

## 官方参考

- [Supported Command Line Switches](https://www.electronjs.org/docs/latest/api/command-line-switches)：Electron 明确支持的开关清单（含 `--enable-features` 等 Chromium 特性说明）
- [Environment Variables](https://www.electronjs.org/docs/latest/api/environment-variables)：全量环境变量及 fuse 限制
- [Debugging the Main Process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)：`--inspect` 官方用法
