# electron-ipc · IPC 通信探针

## 1) Explain · 闭卷 3 题

**Q1**：解释「为什么 IPC 不能传函数 / DOM 节点 / Class 实例」。这个限制是性能优化还是安全设计？

**Q2**：`invoke/handle` 与 `send/on` 在错误传播上有什么本质差异？给一个真实场景，说明哪种不能用、必须换另一种。

**Q3**：两个渲染进程窗口之间要做 60 fps 的实时数据流推送（比如协作光标），为什么不应该走「A → 主进程 → B」的中转？应该用什么机制？

### 通过标准

- Q1：结构化克隆算法；这是安全边界（攻击者拿不到主进程代码），不是性能优化
- Q2：invoke 的 reject 会把 Error.message 跨进程传回；send 不返回任何东西、错误不会自动传回——错误回报多的场景必须用 invoke
- Q3：每次主进程转发都过两次结构化克隆 + 两次事件循环调度，60fps 会丢帧；MessageChannelMain / MessagePort 让两端直连

## 2) Perform · 新起点最小任务

**任务**：做一个「文件保存对话框 + 进度回报」功能：
- 用户点击按钮 → 调 `dialog.showSaveDialog` 选路径
- 主进程模拟 3 秒写文件（每 500ms 推进一次）
- 进度（百分比 + 阶段名）实时推到渲染层显示
- 写完返回最终路径；中途可取消

要求只用 `invoke/handle` + `webContents.send`，不引入额外依赖。

## 3) Debug · 陌生故障定位

```js
// 用户报告：renderer.js 里这段代码有时工作、有时抛「Error: An object could not be cloned」
const complex = {
  created: new Date(),
  pattern: /foo/gi,
  callback: () => 'hello'
}

document.getElementById('btn').addEventListener('click', async () => {
  // 每次按下都重新构造 complex
  await window.api.process(complex)
})
```

**preload.js**：
```js
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  process: (obj) => ipcRenderer.invoke('ipc:process', obj)
})
```

请：
1. 指出哪些字段是「不可克隆」的（精确到字段名）
2. 给出最小修复（去掉这些字段 / 用可克隆的等价物）
3. 解释为什么 `new Date()` 在某些 Electron 版本上能传、某些不能

### 通过标准

- 不可克隆字段：`pattern`（正则）、`callback`（函数）
- 修复：序列化时去掉 callback（IPC 也不该传函数）；正则转字符串或拆成 `{ source, flags }`
- 解释：Date 在最新 V8 中已支持结构化克隆；老版本不支持——表现是「有时报、有时不报」，取决于 Date 内部表示是否落入支持范围

## 4) Transfer · 同机制换约束

**场景**：把上面的进度回报任务改用 `MessageChannelMain` 实现。两个窗口之间直连，主进程只负责初始化时牵一次线。

要求写出最小骨架：主进程创建 MessageChannelMain、给两个窗口 postMessage、两个窗口通过 port.onmessage 互发。

### 通过标准

- 主进程 `new MessageChannelMain()`，把 port1/post1 给窗口 A、port2/post2 给窗口 B
- A 端口监听 `port.onmessage`、发送用 `port.postMessage`
- 主进程牵线后即「离场」，不再参与数据转发