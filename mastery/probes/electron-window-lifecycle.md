# electron-window-lifecycle · BrowserWindow 生命周期探针

## 1) Explain · 闭卷 3 题

**Q1**：按时间顺序列出 BrowserWindow 从 `new BrowserWindow()` 到 `closed` 事件触发之间发生的关键事件。哪些事件是同步、哪些是异步？

**Q2**：macOS 上关闭所有窗口时，`window-all-closed` 与 `before-quit` / `will-quit` / `quit` 的触发顺序是什么？什么时候 `app.quit()` 才真正终止进程？

**Q3**：解释「窗口状态持久化」的常见做法——窗口大小、位置、最大化状态需要恢复时，最容易出错的是什么？

### 通过标准

- Q1：构造（同步）→ `ready-to-show`（异步）→ `show` / `focus` / `resize` / `move`（运行时）→ `close`（可阻止）→ `closed`（同步，最后）
- Q2：所有窗口关闭 → `window-all-closed` → 若未阻止则 `before-quit` → 各窗口 `close` → `will-quit` → `quit`；`app.quit()` 后还会经过这串流程
- Q3：多显示器配置变了（用户拔了外接屏）；保存的窗口位置在当前不可见区域；最大化状态需要单独的标志位恢复

## 2) Perform · 新起点最小任务

**任务**：做一个「窗口状态管理器」：
- 每次窗口 `resize` / `move` / `maximize` / `unmaximize` 时，把状态写入 `app.getPath('userData') + '/window-state.json'`
- 应用启动时读取并恢复（含合法性校验：不能超出当前屏幕范围）
- 路径：`app.getPath('userData') + '/window-state.json'`
- 校验规则：
  - x/y 在任何屏幕范围内
  - width/height 不小于最小值 400x300
  - 如果校验失败，回退到默认 800x600 居中

### 通过标准

- 写入用 `app.getPath('userData')` 而非项目根目录
- 启动时读取并校验；校验失败回退默认值
- 不阻塞主进程事件循环（写盘用 `fs.promises.writeFile` 或 `fs.writeFileSync` 都可，但说明选择）

## 3) Debug · 陌生故障定位

```js
// 用户报告：窗口关闭后，应用进程还在后台运行
const { app, BrowserWindow } = require('electron')

function createWindow() {
  return new BrowserWindow({ width: 800, height: 600 })
}

app.whenReady().then(createWindow)
// 用户没有显式处理 window-all-closed
// macOS 上：关闭所有窗口，应用「看起来」退了，进程还在
```

```js
// 另一份代码：
const win = new BrowserWindow({ width: 800, height: 600 })
win.on('closed', () => {
  console.log('window closed')
  // 这里用户尝试做一些清理工作
  someAsyncCleanup()  // 用户期望 cleanup 完成后才退出应用
})
app.on('before-quit', async (e) => {
  e.preventDefault()
  await someAsyncCleanup()
  app.exit(0)
})
```

**问题**：用户报告 macOS 上关闭所有窗口，应用没退；Windows 上正常退出。

请：
1. 指出 macOS / Windows 行为差异的根因
2. 解释为什么 `before-quit` 里 `e.preventDefault()` + 异步清理是反模式
3. 给出正确的清理时机与生命周期位置

### 通过标准

- 根因：macOS 上关完所有窗口默认不触发 `before-quit`（应用仍存活等 dock 激活），Windows 上 `window-all-closed` 后会自动 `app.quit()`
- 解释：`e.preventDefault()` + 异步操作会让 quit 流程悬挂——`before-quit` 是同步事件，不能可靠地等待异步操作
- 正解：用 `will-quit` 事件（最后一个同步事件）或在 quit 流程外做异步清理 + 通过 `app.exit()` 强制终止

## 4) Transfer · 同机制换约束

**场景**：把窗口状态持久化迁移到多账号窗口场景——每个账号的窗口独立持久化状态，账号切换时恢复对应窗口位置。

要求：
- 状态文件按账号 ID 命名（`window-state-{accountId}.json`）
- 账号登出时弹出「保存当前状态？」对话框
- 登出后清理该账号的窗口对象引用（防止内存泄漏）

### 通过标准

- 状态文件按账号 ID 分文件
- 登出流程：先保存 → 再清 storage → 再销毁窗口
- 窗口对象不持有主进程外的引用