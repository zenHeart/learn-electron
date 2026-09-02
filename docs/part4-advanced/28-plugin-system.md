# 插件系统设计

> **一句话本质**：插件系统 = 把「宿主的能力边界」变成显式契约——隔离度从配置化、脚本化、进程化到外接化层层递进，而第一原则只有一条：**插件能崩，不能带垮宿主**。

读完本章你会获得：可扩展性的四种模式及各自的隔离/成本曲线（含完整 preload 白名单注入代码）、VS Code 扩展进程模型的公开设计借鉴、插件市场的 capability 能力位与 semver 版本协商，以及「什么时候不该做插件系统」的判断。

## 心智模型：四层阶梯

```text
隔离度、复杂度、能力上限 —— 三者同步递增

① 配置化 ──② 脚本化 ──③ 进程化 ──④ 外接化
 feature     preload      独立进程      独立子应用
 flag+主题   受控API+代码  崩溃隔离      进程外组合

宿主对插件代码的信任要求：全信 ─────────────▶ 零信任
一个插件崩掉的爆炸半径：  无 ───────────────▶ 仅插件自己
```

选型从左往右扫：满足需求的最左边的那个就是对的。跳级设计（用户要个主题系统，你上了进程隔离）不是过度设计，是没想清楚。

把四个模式放在同一张表里对账：

| 维度 | ① 配置化 | ② 脚本化 | ③ 进程化 | ④ 外接化 |
|---|---|---|---|---|
| 插件形态 | JSON 声明 | 渲染层 JS | 独立进程内代码 | 独立应用 |
| 宿主信任插件吗 | 无代码，无需信任 | 白名单内信任 | 零信任（只见消息） | 零信任（只见协议） |
| 插件能拿到的能力 | 参数枚举 | 白名单 API | 逐插件授权的代理 API | 协议约定的接口 |
| 崩溃爆炸半径 | 无 | 宿主渲染层 | 单个 Utility 进程 | 插件自己的进程树 |
| 宿主成本 | 极低 | 低 | 中（进程/授权管理） | 高（发现/分发/体验缝合） |
| 典型代表 | 主题市场 | 编辑器脚本（油猴类） | VS Code 扩展 | 浏览器 + 外部协议应用 |

## 模式一：配置化（最轻）

插件 = 一份声明式配置，宿主解释执行。主题、布局、快捷键、feature flag 全属于这层——「用户改的是数据，不是代码」，所以天然安全。

```js
// 插件只是 JSON：theme-plugin.json
{
  "id": "dark-forest",
  "type": "theme",
  "colors": { "bg": "#0b0f0a", "accent": "#4ade80" },
  "apiVersion": "^1.0.0"        // 版本声明，见下文协商
}
```

适用：定制点可被枚举、变化可被参数化。配套的灰度与远程开关基建见[配置章节](/part2-core/13-config)。

## 模式二：脚本化（受控 API + 用户代码）

插件是**代码**，跑在宿主进程内，但只能摸到白名单 API 面。Electron 的标准载体是 contextBridge：渲染层里的插件脚本只见 `window.pluginHost`，不见 `require`、不见 `ipcRenderer`。

```js
// preload.js —— 插件 API 白名单注入（完整可用骨架）
const { contextBridge, ipcRenderer } = require('electron')

// 插件可订阅的宿主事件白名单
const SAFE_EVENTS = ['config:changed', 'theme:changed']

contextBridge.exposeInMainWorld('pluginHost', {
  apiVersion: '1.2.0',

  // 文件访问：主进程侧把路径裁决在插件数据目录内（见下）
  readFile:  (name)         => ipcRenderer.invoke('plugin:fs:read', name),
  writeFile: (name, body)   => ipcRenderer.invoke('plugin:fs:write', name, body),

  // 受控网络：主进程侧带域名白名单，不是任意 fetch
  request:   (url, options) => ipcRenderer.invoke('plugin:http', { url, options }),

  // 宿主事件订阅：事件名必须在白名单内，且返回取消函数
  on: (event, cb) => {
    if (!SAFE_EVENTS.includes(event)) {
      throw new Error(`plugin event not allowed: ${event}`)
    }
    const listener = (_e, ...args) => cb(...args)
    ipcRenderer.on(`plugin:${event}`, listener)
    return () => ipcRenderer.removeListener(`plugin:${event}`, listener)
  }
})
```

```js
// 主进程侧：fs 通道的「路径裁决」——插件永远拿不到真实路径
const PLUGIN_DATA_DIR = path.join(app.getPath('userData'), 'plugins')
ipcMain.handle('plugin:fs:read', (_e, name) => {
  const safe = path.join(PLUGIN_DATA_DIR, name)
  if (!safe.startsWith(PLUGIN_DATA_DIR)) throw new Error('path escape')  // 防 ../ 穿越
  return fs.promises.readFile(safe, 'utf8')
})
```

边界在哪：插件脚本由渲染层 `new Function` / `<script>` 注入，能调的**只有**上面这几个方法——参数校验、路径裁决、域名白名单全在主进程侧。反面教材是给插件环境暴露 `eval` 语义或裸 IPC 通道：任何一个插件被投毒（供应链攻击），整个应用就是它的。

适用：插件逻辑轻（几十到几百行）、可信度中等、需要热加载。

## 模式三：进程化（每个插件一座孤岛）

插件代码进独立进程，宿主与插件之间只剩消息协议。这是隔离的天花板：插件崩溃只死插件，权限按插件粒度逐个授予。

公开设计最成熟的参照是 **VS Code**：扩展不跑在 UI 也不是随便跑，而是统一在一个独立的**扩展宿主（Extension Host）进程**里，扩展调用的每个 API（命令、文件、语言特性）都是宿主进程经 RPC 暴露的**代理对象**——按需、按声明授权，扩展拿不到进程原生能力（见官方文档 [Extending Workbench](https://code.visualstudio.com/api/advanced-topics/extension-host) 与 [VS Code API 指南](https://code.visualstudio.com/api)）。

```text
┌─ 主进程（宿主）──────────┐      ┌─ UtilityProcess（插件宿主）────┐
│  授权中心：插件清单/能力位  │ IPC  │  ┌────────┐ ┌────────┐        │
│  系统资源：fs/net/窗口      │◄────►│  │ 插件 A  │ │ 插件 B  │  ...   │
└──────────────────────────┘      │  └────────┘ └────────┘        │
        ▲ MessagePort             └────────────────────────────────┘
   渲染进程（UI 只见代理 API）
```

Electron 的落地件是 `utilityProcess.fork`：每个插件（或每组）fork 一个 Utility 进程，用 [MessageChannelMain](https://www.electronjs.org/docs/latest/api/message-channel-main) 直连渲染层做 UI 通信——结构上正是 25 章「UtilityProcess 放 CPU 密集 SDK」同一招的复用。最小骨架：

```js
// 主进程：插件加载器
const { utilityProcess, MessageChannelMain } = require('electron')

function loadPlugin(win, manifest) {
  // 每个插件一个宿主脚本：它 require 插件代码、转发授权过的调用
  const child = utilityProcess.fork(path.join(__dirname, 'plugin-host.js'), [], {
    serviceName: `plugin-${manifest.id}`
  })
  // 插件挂了只死插件：重启策略在宿主层做，主进程稳如泰山
  child.on('exit', () => quarantine(manifest.id))   // 拉黑 + 上报，不重启轰炸

  // 一对 MessagePort：渲染层 ↔ 插件进程直连，主进程只做介绍人
  const { port1, port2 } = new MessageChannelMain()
  win.webContents.postMessage('plugin-port', null, [port1])
  child.postMessage('plugin-port', null, [port2])
  return child
}
```

```js
// plugin-host.js —— 跑在 Utility 进程里的「扩展宿主」
process.parentPort.on('message', ({ data, ports }) => {
  if (data === 'plugin-port') {
    const port = ports[0]
    port.on('message', (e) => {
      // 这里做与模式二同构的事：白名单 + 参数校验，再转给插件代码
      route(e.data, pluginModule)
    })
    port.start()
  }
})
```

API 代理层的写法与模式二同构：白名单 + 参数校验，只是通道从 contextBridge 换成进程间消息——「授权中心在主进程、执行在插件宿主、展示在渲染层」三点一线。

适用：第三方开发者生态、插件不可信、单插件可以重（语言服务器、AI 推理）。

## 模式四：外接化（插件即子应用）

最彻底：插件是**完全独立的进程/应用**，与宿主通过协议组合而非代码链接——宿主注册自定义协议（`myapp://`，见[系统章节](/part2-core/11-system)）唤起子应用，或子应用在本地起服务、宿主按约定发现并嵌入（BrowserView/webview 加载其 UI）。

```text
宿主 ──myapp://launch?plugin=chart──▶ 子应用（自有技术栈、自有版本节奏）
     ◄───── 本地服务发现 + 受控回跳 ─────┘
```

代价是体验割裂（UI 风格、输入法、焦点、生命周期都要额外缝合）与分发复杂度。适用：插件方是独立团队/独立公司，或插件本来就有完整产品形态（比如把一个 Web IDE 作为你应用的「代码编辑插件」）。

典型组合流：子应用安装时向宿主注册清单文件（声明协议入口与能力需求）→ 宿主发现并展示插件入口 → 用户点击时宿主经自定义协议唤起子应用并带上一次性令牌 → 子应用回连宿主的本地校验接口完成授权。每一步都只有「协议与令牌」，没有共享代码——这是四模式里唯一天然免疫插件代码质量问题的。

```text
发现（清单文件）→ 展示（宿主 UI）→ 唤起（myapp://launch + 令牌）→ 回连（本地校验）
```

分发即部署：子应用升级与宿主完全解耦，代价是你要接受「插件版本永远参差不齐」——版本协商（下一节）在这个模式下不是增强项，是地基。

## 插件市场：版本兼容的两张牌

插件生态一出现「宿主 2.x 跑插件 1.x」的错配，崩的是宿主的口碑。第 25 章为壳与 Web 协作引入的**能力位协商**，原样迁移过来：

```js
// 插件清单声明：我要什么能力、接受哪个 API 大版本
{
  "id": "dark-forest",
  "engines": { "myapp-host": "^1.2.0" },   // semverRange：宿主版本约束
  "capabilities": ["fs.read", "http"]        // 能力位：我要的权限
}
```

```js
// 宿主加载器：先协商，后加载
const hostSemver = semver.coerce(host.version)
if (!semver.satisfies(hostSemver, manifest.engines['myapp-host'])) {
  return refuse('host version out of range')      // 拒载并提示，不是崩
}
const missing = manifest.capabilities.filter(c => !host.capabilities[c])
if (missing.length) return degrade(missing)       // 缺能力则降级运行
```

配套纪律与 25 章相同：宿主下线任何插件 API 前，能力位先置 false 一个发布周期；能力调用失败要埋点——市场里最贵的事故是「静默不兼容」。

::: exp 实战经验
什么时候**不要**做插件系统：日活千级以下的产品，「用户想要扩展」几乎都是伪需求——真实分布是「一两个大客户想要 X 定制」。这时正解是 feature flag + 按客户构建配置（多身份打包，见 27 章），成本是插件系统的百分之一。插件系统是**生态产品**而不是功能：只有当你预期「第三方开发者会为你写代码」且愿意运营审核/分发/版本协商的整套基建时才立项。判断题：你能说出五个「不认识的人」想写的插件吗？说不出，先做配置化。
:::

::: pitfall 坑位警报
两个原则性错误，都见过生产事故：

**① 把第三方插件代码 require 进主进程**。主进程 = 完整 Node 权限（fs、child_process、原生模块）。任何一个插件被投毒，攻击者就拿到了用户操作系统的执行权——这不是「可能」，是 npm 供应链攻击的既定剧本。第三方代码的最低底线是模式二（渲染层 + 白名单 API），生态级就该上模式三。

**② 插件把宿主拖崩**。一个插件的同步死循环让整个应用卡死、一个插件的数据让主流程抛异常——这违背插件系统的第一原则「插件能崩，不能带垮宿主」。落地为三条工程纪律：插件加载全部异步且带超时；单个插件失败进隔离的「禁用列表」而不是启动失败；宿主核心路径对插件数据一律防御性校验（当作不可信输入处理，与 10 章安全模型同源）。
:::

## 延伸阅读

- [VS Code Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host) —— 进程化模式的公开标杆设计
- [VS Code Extension API](https://code.visualstudio.com/api) —— 「API 代理 + 按需授权」的完整范式
- [UtilityProcess API](https://www.electronjs.org/docs/latest/api/utility-process) —— Electron 的进程化载体
- [contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge) —— 模式二的注入件
- 本书[安全章节](/part2-core/10-security) —— 「不可信输入」的防御基线
- 本书[25 章 · 能力位协商](/part4-advanced/25-sdk-integration) —— 版本兼容契约的原产地
