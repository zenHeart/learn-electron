# .node 扩展开发

> **一句话本质**：亲手写一个 `.node` 原生模块，本质是签一份「ABI 契约」——你的 C++ 产物必须和宿主（Node 或 Electron）的 ABI 对齐；选 N-API 这代技术，是为了让这份契约跨版本、跨运行时都成立，不用每次升级都重编。

读完本章你会获得：N-API / NAN / node-addon-api 三代技术的选型判断、从零手写一个可编译可调用的 addon 的完整路径（源码 → binding.gyp → 编译 → JS 调用）、Electron 加载原生模块的 ABI 原理与 `@electron/rebuild`、prebuildify 预编译分发模式、原生模块的 C++ 断点调试方法。第 25 章讲「怎么把 SDK 放进架构」，本章讲「.node 这个产物本身怎么造出来」。

## 心智模型：一个产物，一份契约

```text
你的 C++ 源码 ──编译──▶ .node 文件（动态库）
                          │
                          ▼
              require() 时 Node 运行时加载它
                          │
                 ABI 契约是否对齐？
              ├─ 对齐 → 正常运行
              └─ 不对齐 → NODE_MODULE_VERSION 报错（见下文坑位）
```

原生模块开发的所有痛苦，都来自「契约」二字：编译产物锁死在某一族 ABI 上。三代原生技术史，就是一部「怎么让契约更宽松」的历史。

## 一、三代技术：为什么新代码必须 N-API

| | NAN | N-API | node-addon-api |
|---|---|---|---|
| 诞生 | 2014 年前后 | Node 8（2017） | 2018 |
| 形态 | C++ 模板库 | **C 接口层** | N-API 之上的 C++ 封装（header-only） |
| ABI | 不稳定，直接用 V8 C++ API | **稳定**（Node 官方承诺） | 继承 N-API 的稳定 |
| 升级 Node/Electron | 每个大版本**必须重编** | 免重编 | 免重编 |
| 写法体验 | 接近 C++ | 纯 C，样板极多 | 接近 NAN，最舒服 |
| 现状 | 维护模式，勿用于新代码 | 契约层 | **新代码默认选择** |

关键认知：**N-API 不是一个「写法库」，而是一层 ABI 稳定的 C 接口契约**。用它编译出的 `.node`，在官方 Node 和 Electron 之间、在 Node 18 和 Node 22 之间，理论上免重编直接跑。node-addon-api 只是让这层 C 契约写起来像现代 C++——它编译期全部内联，不引入运行时依赖。

（写 Rust 的团队看一眼 [napi-rs](https://github.com/napi-rs/napi-rs)：同一层 N-API 契约的 Rust 绑定，产物直接是各平台预编译包，思路与本章一致。）

## 二、手写第一个 addon

### 2.1 工程结构

```text
myaddon/
├── package.json
├── binding.gyp        # 编译配置（告诉 node-gyp 源码与头文件在哪）
├── myaddon.cc         # C++ 源码
└── index.js           # JS 入口（可选，也可直接 require 产物）
```

```json
// package.json（关键字段）
{
  "name": "myaddon",
  "main": "index.js",
  "dependencies": {
    "node-addon-api": "^8.0.0",
    "node-gyp-build": "^4.8.0"
  }
}
```

### 2.2 C++ 源码：`hello(name)` 与 `add(a, b)`

```cpp
// myaddon.cc
#include <napi.h>

// hello(name) -> "hello, <name>"
Napi::String Hello(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::string name = info[0].As<Napi::String>().Utf8Value();
  return Napi::String::New(env, "hello, " + name);
}

// add(a, b) -> a + b
Napi::Number Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  double a = info[0].As<Napi::Number>().DoubleValue();
  double b = info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(env, a + b);
}

// 模块入口：把两个函数挂到 exports 上
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("hello", Napi::Function::New(env, Hello));
  exports.Set("add",   Napi::Function::New(env, Add));
  return exports;
}

NODE_API_MODULE(myaddon, Init)
```

对照着读：`Napi::CallbackInfo` 是调用上下文，`info[0]`/`info[1]` 取 JS 传进来的参数（注意类型转换是显式的——JS 是动态类型，C++ 不是），返回值包成 `Napi::String`/`Napi::Number` 跨界回 JS。`NODE_API_MODULE` 是注册宏，`Init` 在模块第一次被 require 时执行一次。

### 2.3 binding.gyp 与编译

```python
# binding.gyp
{
  "targets": [
    {
      "target_name": "myaddon",
      "sources": ["myaddon.cc"],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}
```

`include_dirs` 里那行 `<!(node -p ...)` 是 shell 展开：运行时问 node-addon-api 要它的头文件目录。`NAPI_DISABLE_CPP_EXCEPTIONS` 关掉 C++ 异常，错误走返回值——跨平台编译少踩一个坑。

```bash
npm install            # 拉下 node-addon-api
npx node-gyp rebuild   # 产物：build/Release/myaddon.node
```

### 2.4 JS 侧调用

```js
// index.js
module.exports = require('./build/Release/myaddon.node')
```

```js
// test.js（用官方 Node 跑）
const addon = require('./')
console.log(addon.hello('Electron'))  // hello, Electron
console.log(addon.add(1, 2))          // 3
```

到这里，addon 在官方 Node 下已经能跑。真正的分水岭在下一节。

## 三、在 Electron 里加载：ABI 的那堵墙

把同一个项目切到 Electron 主进程里 `require('./')`，大概率直接报错：

```text
Error: The module '...build/Release/myaddon.node' was compiled against
a different Node.js version using NODE_MODULE_VERSION X.
This version of Node.js requires NODE_MODULE_VERSION Y.
Please try re-compiling or re-installing ...
```

**原理**：Electron 内置的是自己定制的 Node（带定制 V8），它的 ABI 号（`process.versions.modules`）与同版本号官方 Node **不同**。你刚才用 `node-gyp rebuild` 编译时，默认链接的是本机官方 Node 的头文件与 ABI，于是契约不对齐。

### 解法：@electron/rebuild

```bash
# 针对当前项目的 Electron 版本，重编全部原生依赖
npx @electron/rebuild
# 只重编一个模块（快）
npx @electron/rebuild -o myaddon
```

它做的事：读到你项目的 Electron 版本 → 从 Electron 官方的 headers 镜像拉取对应 Node 头文件 → 以 Electron 的 ABI 重跑 node-gyp。工程化做法是挂到 postinstall，让 `npm install` 之后自动对齐：

```json
"scripts": {
  "postinstall": "electron-builder install-app-deps"
}
```

### N-API 的回报时刻

注意上面报错的是「针对 Node 的 ABI 编译」的模块。如果你的模块走 N-API 契约（本章代码就是），**同一个 `.node` 在官方 Node 和 Electron 里都能加载**——这正是 2.1 表格里「免重编」的含义：`@electron/rebuild` 对 N-API 模块经常是空操作。只有直接用 V8 API 的老模块（NAN 时代）才被 ABI 反复折磨。

## 四、prebuildify：预编译分发模式

源码编译路线要求每个用户机器上都有完整工具链（Windows 上尤其奢侈）。分发的正解是**把编译产物直接随包发布**——[prebuildify](https://github.com/prebuild/prebuildify) 是这个模式的标准工具：

```bash
# 在你的 addon 包仓库里（构建期，通常在 CI）
npx prebuildify --napi          # 产物 → prebuilds/<平台>/<架构>/napi.node
npx prebuildify --napi --arch arm64   # macOS arm64 再来一份
```

```js
// index.js 改用 node-gyp-build 加载：优先挑预编译产物，没有才回落源码编译
module.exports = require('node-gyp-build')(__dirname)
```

```json
// package.json 把 node-gyp-build 挂成 install 脚本：
// 有匹配的 prebuild → 什么都不做；没有 → 自动 node-gyp rebuild
"scripts": { "install": "node-gyp-build" }
```

三步之后，用户 `npm install` 你的包：匹配平台直接用产物（秒装），不匹配才本地编译（兜底）。社区流行两条路线——**prebuildify** 把产物打进 npm 包随包分发；**prebuild-install**（better-sqlite3 的做法）在 install 时按当前平台/运行时从 GitHub Releases 下载预编译资产，下载失败再回落源码编译。前者多传体积换确定性，后者省体积但依赖网络与 Release 资产的完整性。

::: exp 实战经验
给团队的 addon 工程化建议，三条底线：① **CI 三平台矩阵编译**（mac arm64/x64、win x64、linux x64），prebuilds 产物要么直接提交进仓库、要么挂到 Release 资产，二选一但必须可追溯；② 包内永远保留源码编译回落路径（node-gyp-build 的 install 脚本就是干这个的），覆盖 prebuild 没覆盖到的冷门环境；③ **Electron 大版本升级 = 原生模块回归清单**——即使 N-API 承诺免重编，也要把「加载 + 冒烟 + 崩溃恢复」跑一遍，因为 ABI 之外还有运行时行为差异。这份清单和第 25 章的 SDK 升级验证是同一张表。
:::

## 五、调试：断点打进 C++ 里

原生模块不能 `console.log` 调试一切——段错误发生在 JS 之下。姿势是**把调试器 attach 到加载了 `.node` 的进程**：

1. **编译带调试符号**：`npx node-gyp rebuild --debug`（产物在 `build/Debug/`，别把 Debug 版带上生产）。
2. **VS Code**：装 C/C++ 扩展（ms-vscode.cpptools），用 `cppdbg`（macOS/Linux，lldb 后端）或 `cppvsdbg`（Windows）类型的 launch 配置 attach 到 Electron 主进程，直接在 `myaddon.cc` 上打断点：

```json
// .vscode/launch.json —— Windows 用 cppvsdbg，macOS/Linux 用 cppdbg
{
  "configurations": [
    {
      "name": "Attach to Electron (C++)",
      "type": "cppdbg",                      // Windows 换成 "cppvsdbg"
      "request": "attach",
      "program": "${workspaceFolder}/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron",
      "MIMode": "lldb",                      // Windows 用 "vsdbg"（cppvsdbg 时省略）
      "sourceFileMap": {
        // 把编译期源码路径映射回本机工程，断点符号才能对上
        "${workspaceFolder}": "${workspaceFolder}"
      }
    }
  ]
}
```

3. **命令行党**：mac 下 `lldb -- ./node_modules/.bin/electron .` 启动即断；或 `lldb` 里 `process attach --name Electron`。断进去之后 `bt` 看调用栈，能同时看到 JS 栈帧与 C++ 栈帧的交界——那是理解「跨界调用成本」最直观的一课。

主进程 JS 层怎么开调试器，见[调试章节](/part3-engineering/16-debugging)；原生侧更深的踩坑记录（Felix Rieseberg，Electron 团队成员）见[延伸阅读](#延伸阅读)。

::: pitfall 坑位警报
三个高频翻车现场：

**① Windows 没装 VS Build Tools**。报错形态是 `gyp ERR! find VS` / `Could not find any Visual Studio installation to use`——node-gyp 需要 MSVC 工具链。解法：装 Visual Studio Build Tools，勾选「使用 C++ 的桌面开发」工作负载。别用早已停止维护的 `windows-build-tools`。

**② Apple Silicon 双架构**。M 系芯片上默认编出 arm64，但你的用户可能跑 x64 Electron（Rosetta）。`@electron/rebuild --arch=x64` 或 prebuildify `--arch=arm64` + `--arch=x64` 各编一份；打 universal 包时两个架构的产物缺一不可。

**③ NODE_MODULE_VERSION 报错别瞎修**。读到这报错先查 `process.versions.modules`（在目标运行时里打印，Node 与 Electron 各打一次），确认「编译时用的 X」与「运行时要的 Y」各是多少，再决定是 rebuild（自己的模块）还是换 prebuild 版本（三方模块）。直接删掉重装 node_modules 是玄学，理解 ABI 才是一次修复。常用对照（官方 Node）：

| Node 版本 | NODE_MODULE_VERSION |
|---|---|
| 18.x | 108 |
| 20.x | 115 |
| 22.x | 127 |

Electron 每个版本有自己的 ABI 号（与同 V8 的官方 Node 也不同），别背表，跑起来打印 `process.versions.modules` 才是唯一可信来源。
:::

## 延伸阅读

- [Using Native Node Modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) —— 官方对 ABI 与 rebuild 的权威说明
- [Native Code and Electron](https://www.electronjs.org/docs/latest/tutorial/native-code-and-electron) —— 官方手把手教程：从 C++ 写到在 Electron 里用
- [Node-API 文档](https://nodejs.org/api/n-api.html) —— ABI 稳定层的契约原文
- [node-addon-api](https://github.com/nodejs/node-addon-api) —— 本章使用的 C++ 封装层，README 即完整教程
- [prebuildify](https://github.com/prebuild/prebuildify) 与 [node-gyp-build](https://github.com/prebuild/node-gyp-build) —— 预编译分发组合拳
- [Debugging the Main Process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process) —— attach 主进程的官方姿势
- [Debugging native Node.js addons with Electron on macOS](https://felixrieseberg.com/debugging-native-node-js-addons-with-electron/) —— Electron 团队成员的 lldb 实操（社区）
