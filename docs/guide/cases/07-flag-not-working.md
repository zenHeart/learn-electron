# 案例 7：命令行开关不生效——三步查证法

## 现象

想用 Chromium flag 解决一个渲染问题（如禁用硬件媒体键接管：`disable-features=HardwareMediaKeyHandling`），加上了却毫无效果。同一个 flag 在 Chrome 浏览器里是有效的。

## 三步查证法

### 第一步：确认 Electron ↔ Chromium 版本对应

```bash
# 查你使用的 Electron 对应的 Chromium 版本
# https://releases.electronjs.org/ 或本地：
npx electron -e "console.log(process.versions)"
# { electron: 'xx.y.z', chrome: 'yyy.a.b.ccc', node: '...' }
```

flag 的存在性跟 Chromium 大版本走——你记忆里「Chrome 有这个 flag」可能是别的版本。

### 第二步：去 Chromium 源码确认 flag 真实存在

对应版本源码里查证（以 108 为例）：

- `feature_list.cc` —— `disable-features` / `enable-features` 能关开的 feature 名单；
- `base_switches.cc` —— 基础开关；
- GPU 相关 flag 看 `gpu_switches.cc`。

查不到名字 = 这个 flag/feature 在该版本不存在，写法再对也无效。

### 第三步：核对注入方式与时机

四种注入方式各有约束，选错就静默失效：

| 方式 | 正确用法 | 失效场景 |
|---|---|---|
| 命令行直传 | `app --disable-features=Xxx` | 参数拼错、被后续覆盖 |
| `app.commandLine.appendSwitch` | **内置 Chromium flag** | 在 `app.ready` 之后才调用（太晚，Chromium 已初始化） |
| `app.commandLine.appendArgument` | **自定义参数**（`--my-flag=1` 给自己读的） | 把自定义参数用 appendSwitch（语义反了） |
| `NODE_OPTIONS` / `webPreferences.additionalArguments` | 只影响 Node 侧 / 渲染进程 argv | 期望它影响 Chromium 行为 |

本例根因正是第三步：flag 写在了 `whenReady()` 回调里——Chromium 的 feature 列表在 ready 前就已冻结。

## 修复

```js
// ✅ 必须在 app ready 之前，模块顶层同步执行
const { app } = require('electron')
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService')

app.whenReady().then(/* ... */)
```

进阶查证：Chromium 自己的测试代码是最可靠的用法样本——`gpu_tests/` 目录下的参数文件里全是「验证过有效」的 flag 组合。

## 预防

- 封装一个 `applyChromiumFlags()` 启动函数集中管理所有 flag，强制在 ready 前调用。
- flag 生效验证：启动后打印 `app.commandLine.hasSwitch(...)` + 实际行为对照，别凭感觉。
- 完整速查表见[附录 · 命令行速查](/appendix/cli-reference)。
