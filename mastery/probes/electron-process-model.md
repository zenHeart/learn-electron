# electron-process-model · 进程模型探针

## 1) Explain · 闭卷 3 题

不开任何文档，口述回答：

**Q1**：解释为什么 Electron 渲染进程默认没有 Node 能力——这是设计缺陷还是安全必要？如果给一个渲染进程打开 `nodeIntegration: true`，攻击者注入一段 XSS 脚本后能做到什么？

**Q2**：主进程事件循环被一段 CPU 密集计算阻塞 5 秒，会发生什么？哪些现象是你能在 UI 上观察到的？哪些进程还活着，哪些已经冻死？

**Q3**：两个 BrowserWindow 各自有一个渲染进程，它们之间能直接共享一个 JS 对象吗？为什么？正确的做法是什么？

### 通过标准

- Q1：明确「不可信内容」是渲染进程的天职，XSS + Node = 任意命令执行
- Q2：所有窗口一起冻结，主进程不响应 IPC；GPU 进程独立可活
- Q3：进程间地址空间不共享，只能走结构化克隆；主进程做中转或用 MessagePort

## 2) Perform · 新起点最小任务

从空目录开始，30 分钟内独立完成：

**任务**：创建一个 Electron 应用，开三个 BrowserWindow，每个窗口显示自己是「第 N 个窗口」、当前进程 PID 和平台。要求：
- 应用启动时三个窗口一起出现
- 关闭任意一个窗口不影响其他两个
- macOS 上关完所有窗口后应用不退出；点击 dock 图标重新创建窗口
- 主进程在终端打印每个窗口的 PID 与内存占用（MB）

### 通过标准

- `package.json` 正确指向入口
- `app.whenReady()` 之前没有创建窗口
- `window-all-closed` 区分 mac / 其他平台
- `activate` 事件正确处理「零窗口时重建」

## 3) Debug · 陌生故障定位

```js
// 用户报告：主进程函数有时不执行，看起来像是「卡死了」
// 下面是可疑代码片段

// main.js
const { app, BrowserWindow, ipcMain } = require('electron')

ipcMain.handle('compute:slow', async () => {
  // 一个「计算密集」的函数
  let total = 0
  for (let i = 0; i < 1e9; i++) {
    total += Math.sqrt(i)
  }
  return total
})

// preload.js
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  run: () => ipcRenderer.invoke('compute:slow')
})

// renderer.js
document.getElementById('btn').addEventListener('click', async () => {
  await window.api.run()
})
```

**问题**：用户在主进程上还注册了一个「心跳」：
```js
setInterval(() => console.log('主进程心跳', Date.now()), 1000)
```
按下按钮后，心跳日志明显变慢甚至停几秒——「主进程卡死了」。请：
1. 指出根因（精确到机制而非表面现象）
2. 给出最小修复（不改变函数语义）
3. 解释为什么这个修复不影响 IPC 的正常工作

### 通过标准

- 根因：主进程是单线程事件循环，CPU 密集阻塞 = 整个事件循环停摆
- 修复：把计算挪到 UtilityProcess 或 worker_threads
- 解释：UtilityProcess / worker_threads 是独立线程池，不影响主进程事件循环；IPC 跨进程仍可正常返回结果

## 4) Transfer · 同机制换约束

**场景**：现在你需要做一个「长任务管理器」——同时跑 5 个 CPU 密集任务，每个任务 10 秒，要求：
1. 任意一个任务失败不影响其他 4 个
2. 主进程全程可响应其他 IPC（心跳不能停）
3. 任务进度可实时推送到渲染层（每 200ms 一次）

请选一个机制（UtilityProcess / worker_threads / child_process），说明选型理由，写出最小骨架代码（不需要完整业务，只演示「启动 5 个 → 进度回报 → 主进程转发到 webContents」链路）。

### 通过标准

- 选 UtilityProcess（理由：自带 Node 环境、原生支持 Electron IPC、独立进程）
- 主进程不被阻塞
- 任务失败被 try/catch 隔离
- 进度回报走 `webContents.send`，渲染层订阅可取消