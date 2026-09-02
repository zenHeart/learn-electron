# 数据与存储

> **一句话本质**：存储选型 = 按「**谁读写、多大、多敏感**」三个维度分层——渲染层用 Web 存储，主进程用文件/数据库，凭据类一律进系统级加密 `safeStorage`。

读完本篇你能获得：一张可执行的分层决策表、`userData` 目录的完整认知（哪些子目录碰不得）、原子写与双轨配置的落地代码、`safeStorage` 加密 token 的完整示例，以及 Chromium `Preferences` 脏数据导致的 UI 异常排查法。

## 心智模型：三个维度定层级

| 存储方案 | 谁读写 | 适合量级 | 敏感度 | 典型数据 |
| --- | --- | --- | --- | --- |
| `localStorage` / `sessionStorage` | 渲染层 | KB 级，几百条 | 低 | UI 偏好、草稿 |
| `IndexedDB` | 渲染层 | MB 级，结构化 | 低 | 离线缓存、消息记录 |
| JSON 文件（主进程） | 主进程 | KB~MB | 中 | 应用配置、窗口状态 |
| electron-store 类封装 | 主进程 | KB 级 | 中 | 键值型配置，省样板代码 |
| SQLite（better-sqlite3） | 主进程 | GB 级 | 中 | 聊天记录、日志检索 |
| `safeStorage` 加密 | 主进程 | 小块凭据 | **高** | token、密码、密钥 |

三条决策线，按顺序问：

1. **谁产生、谁消费？** 只有渲染层用的 UI 状态放 Web 存储；主进程要读的（启动配置、登录态判断）放主进程文件——否则渲染层每次都要经 IPC 转发。
2. **多大？** 键值小数据用 JSON 文件；超过几万条、需要条件查询就必须上 SQLite，JSON 全量读写会线性变慢。
3. **多敏感？** 泄漏会造成账号损失的（token、密码），一律 `safeStorage`，明文落盘不可接受。

## 一切落在哪：`app.getPath('userData')`

Electron 应用所有持久化数据的根目录：

| 平台 | 默认路径 |
| --- | --- |
| Windows | `%APPDATA%/{app.name}` |
| macOS | `~/Library/Application Support/{app.name}` |
| Linux | `~/.config/{app.name}` |

`app.name` 取 `package.json` 的 `name`（或 `productName`）。**它在应用生命周期内保持稳定**——`app.name` 改名等于换了一个全新的数据目录，用户的配置会"全部丢失"。

```js
const { app } = require('electron')
app.getPath('userData')   // 数据根目录
app.getPath('downloads')  // 系统下载目录
app.getPath('temp')       // 临时目录
// 可以改，但必须在模块加载早期、任何窗口创建之前
// app.setPath('userData', '/data/my-custom-dir')
```

目录里的内容分两类——**你自己写的**和 **Chromium 自管理的**：

```text
userData/
├── Preferences            ← Chromium：应用级设置（含缩放持久化！见下文陷阱）
├── Local Storage/         ← Chromium：leveldb 存的 localStorage
├── Session Storage/       ← Chromium：sessionStorage
├── IndexedDB/             ← Chromium：IndexedDB 数据库文件
├── Cache/                 ← Chromium：HTTP 缓存（可安全删除）
├── Code Cache/            ← Chromium：JS 编译缓存（可安全删除）
├── Cookies                ← Chromium：SQLite 存的 Cookie
├── window-state.json      ← 你自己写的（窗口状态持久化）
└── config.json            ← 你自己写的（应用配置）
```

Chromium 自管理的那批目录是**渲染环境的持久化状态**：删 `Cache` 无害（下次冷启动变慢）；删 `Local Storage`、`Cookies`、`IndexedDB` 等于重置用户的登录态与站点数据。没有明确理由，不要动它们。

## 渲染层存储：localStorage 与 IndexedDB

就是标准 Web API，但要清楚它们"住"在哪里：**跟随当前窗口 session 的 Chromium profile**（默认 session 挂在 `userData` 下；指定了 `partition` 则跟随各自分区）。

```js
// 渲染层：与浏览器里写法完全一致
localStorage.setItem('ui.sidebarCollapsed', 'true')
localStorage.getItem('ui.sidebarCollapsed')

// 条件查询、大数据量走 IndexedDB（异步、索引、事务）
const db = await indexedDB.open('chat-cache', 1)
```

清理与排查在主进程侧完成：

```js
// 主进程：精准清理某类存储（比让用户手动删目录体面得多）
await win.webContents.session.clearStorageData({
  storages: ['localstorage'] // 可选 'cookies'、'indexdb'、'cachestorage' 等
})
```

## 主进程 JSON 配置：原子写是底线

```js
const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron')

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json')
const TMP_PATH = `${CONFIG_PATH}.tmp`

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    return {} // 不存在或损坏：按默认配置处理，绝不阻断启动
  }
}

function writeConfig(config) {
  // 原子写：先写临时文件再 rename。直接 writeFileSync 到目标文件，
  // 写一半断电/崩溃会留下截断的 JSON，下次启动配置全丢
  fs.writeFileSync(TMP_PATH, JSON.stringify(config, null, 2))
  fs.renameSync(TMP_PATH, CONFIG_PATH) // 同目录 rename 在各平台都是原子替换
}
```

`rename` 原子性的前提是**临时文件与目标文件在同一卷**（同一目录必然同卷），所以临时文件永远放在目标旁边，不要放系统 temp 目录。

### 双轨配置：出厂配置 + 用户配置

升级不丢配置的行业标准做法——安装目录一份只读出厂值，用户目录一份覆盖值，运行时合并：

```js
const defaults = JSON.parse(
  fs.readFileSync(path.join(process.resourcesPath, 'default-config.json'), 'utf8')
)
const user = readConfig()
// 合并规则：用户配置覆盖出厂配置，出厂配置提供新增字段的默认值
// （新版本加了配置项，老用户的 config.json 里没有，靠出厂值补齐）
const effective = { ...defaults, ...user }
```

好处：版本升级新增配置项有兜底默认值；用户配置永远只存"改过的"；出现疑难杂症时删掉用户配置可回到出厂状态。

## SQLite：better-sqlite3

数据量上万条、需要条件查询/排序/聚合时上 SQLite。`better-sqlite3` 是同步 API，主进程里小查询天然简单：

```js
const Database = require('better-sqlite3')

const db = new Database(path.join(app.getPath('userData'), 'app.db'))
db.pragma('journal_mode = WAL') // WAL 模式：读写并发更好，崩溃恢复更安全

db.exec(`
  CREATE TABLE IF NOT EXISTS message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    content TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_message_chat ON message (chat_id, created_at);
`)

// 预编译语句：高频读的标配
const listByChat = db.prepare(
  'SELECT * FROM message WHERE chat_id = ? ORDER BY created_at DESC LIMIT 100'
)
const rows = listByChat.all('chat-001')
```

它是**原生模块**（Node API 级别绑定 V8），对 Electron 版本的 ABI 敏感：换 Electron 版本必须重新编译，集成与打包要点见[原生能力扩展](/guide/10-native)。

## safeStorage：凭据加密的完整示例

原理一句话：主进程调用操作系统级加密，密钥不在你的代码里，也不在你的文件里。

| 平台 | 后端 | 密钥特性 |
| --- | --- | --- |
| Windows | DPAPI | 绑定当前 Windows 用户，同一用户可解，换用户/换机器解不开 |
| macOS | Keychain | 系统钥匙串管理，可触达用户授权弹窗 |
| Linux | libsecret（GNOME Keyring / KWallet） | 依赖桌面环境；无密钥环时 `isEncryptionAvailable()` 返回 false |

```js
const { safeStorage } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { app } = require('electron')

const TOKEN_PATH = path.join(app.getPath('userData'), 'token.bin')

// 存：token 永远不以明文形态落盘
function saveToken(plainToken) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('系统加密不可用：拒绝明文保存凭据')
  }
  const encrypted = safeStorage.encryptString(plainToken) // 返回 Buffer
  fs.writeFileSync(TOKEN_PATH, encrypted)
}

// 读：解密失败（换机器/系统重装/文件损坏）按"未登录"处理
function readToken() {
  try {
    const encrypted = fs.readFileSync(TOKEN_PATH)
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

// 可选：诊断当前实际生效的加密后端
console.log(safeStorage.getSelectedStorageBackend?.())
```

拿到的密文是**本机绑定**的：不能同步给其他设备、不能进代码仓库。多设备同步需求要靠服务端重新下发 token，而不是搬密文。

## Chromium 持久化陷阱：Preferences 脏数据

`userData/Preferences` 是 Chromium 自维护的 JSON，里面有个和你的应用代码无关、但会直接破坏 UI 的键：`per_host_zoom_levels`——**每个 host 的缩放级别会被持久化**，且对用户不可见。

```js
// 渲染层任何一处调用（或用户 Ctrl+滚轮）都会写入该 host 的持久化缩放
webFrame.setZoomLevel(1.5)
```

典型症状：某个页面（或某台机器上的所有页面）打开即缩放异常、布局崩坏甚至白屏，而你的代码里"没有任何缩放逻辑"——脏数据在 Preferences 里，不在代码里。完整事故复盘见[案例：缩放持久化白屏](/guide/cases/01-zoom-white-screen)。

排查与清理：

```js
// 1. 排查：关闭应用后直接看文件（运行中修改会被 Chromium 覆盖写回）
const pref = JSON.parse(fs.readFileSync(
  path.join(app.getPath('userData'), 'Preferences'), 'utf8'
))
console.log(pref.per_host_zoom_levels) // 出现非 0 值即是脏数据

// 2. 运行时清理：把当前 host 的缩放重置回默认（会同步写回 Preferences）
win.webContents.setZoomLevel(0)
```

不要图省事整个删掉 `Preferences`——它还保存设备比例、语言等其他渲染环境状态，全删等于重置用户环境。精准清理那个键，或引导用户重置缩放。

## 实战要点

::: exp
**1. 配置双轨读写，升级永不丢配置。** 安装目录 `default-config.json`（随包更新、只读）+ `userData/config.json`（用户覆盖、读写），运行时 `{ ...defaults, ...user }` 合并。新版本新增配置项自动有默认值，用户目录里只存增量。

**2. 写文件一律"临时文件 + rename"原子写。** `writeFileSync` 直写目标文件，进程在写入中途被杀（断电、崩溃、被任务管理器结束）会留下截断文件。`writeFileSync(tmp)` 后 `renameSync(tmp, file)`，读者要么看到旧文件、要么看到完整新文件，永远不会看到半个。
:::

## 坑位警报

::: pitfall
**1. 渲染层 localStorage 迁移成本极高。** 它跟随 Chromium profile：用户"清缓存"（清理工具/重装/你调用 `clearStorageData`）即丢；窗口换了 `partition` 也读不到。**只放丢了也无所谓的 UI 状态**，登录态、业务数据放这里等于埋雷——且它没有导出/迁移的官方通道，后期搬迁只能逐条 IPC 导出。

**2. Windows 下 userData 可能"分裂"成两个目录。** 应用以管理员身份运行、被计划任务/服务以其他用户启动时，`%APPDATA%` 解析到**不同用户的配置目录**——同一台机器出现两套配置、两份登录态，表现为"设置偶尔丢失"。排查：确认进程运行用户；根治：对必须统一的位置用 `app.setPath('userData', ...)` 钉死到固定路径，并尽量避免以不同权限身份运行同一应用。
:::

## 延伸阅读

- [App API](https://www.electronjs.org/docs/latest/api/app) — `getPath`、`setPath` 与应用级路径管理
- [Safe Storage API](https://www.electronjs.org/docs/latest/api/safe-storage) — 各平台加密后端说明
- [Cookies API](https://www.electronjs.org/docs/latest/api/cookies) — Cookie 的编程式读写与过滤
- [MDN：Web Storage API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Storage_API) / [MDN：IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API) — 渲染层存储标准
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3) — 同步 SQLite API 与基准
