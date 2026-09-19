# electron-performance-memory · 内存性能探针

## 1) Explain · 闭卷 3 题

**Q1**：解释 `process.memoryUsage().rss` 和 `v8.getHeapStatistics().used_heap_size` 的区别。为什么「rss 只涨不跌是常态」？看哪个指标判断 JS 泄漏？

**Q2**：`app.getAppMetrics()` 返回的 `workingSetSize` 在 Windows 和 macOS 上口径有什么差异？为什么「应用总内存」要用 private working set 求和？

**Q3**：解释 V8 老生代 GC 的 Mark-Compact 停顿为什么会卡顿？给出 2 个「该死没死」的对象模式。

### 通过标准

- Q1：rss 是进程驻留物理内存（含 native，OS 惰性回收）；used_heap_size 是 V8 管理的 JS 对象占用；判断 JS 泄漏看 used_heap_size / heapUsed，看 rss 是看 native 模块是否泄漏
- Q2：Windows 是 working set（含已换出），macOS 是 private bytes；多进程间不重复计 shared 才不会把同一块内存算 N 次
- Q3：Mark-Compact 触发时主线程被暂停，停顿期间渲染与 IPC 全卡；典型模式：全局 Map 持续累加、定时器回调持有大对象引用

## 2) Perform · 新起点最小任务

**任务**：做一个内存监控仪表盘：
- 主进程每 5 秒轮询 `app.getAppMetrics()`，把所有渲染进程的 `workingSetSize` 求和
- 把结果通过 IPC 推到渲染层
- 渲染层用 canvas 画一张折线图（最近 60 个采样点）
- 当任意进程超过 500MB 时在窗口 title 上加「⚠️」前缀

### 通过标准

- 主进程定时器（`setInterval`）要能被清理（在 `before-quit` 清）
- 渲染层折线图用 Canvas，不引入额外图表库
- 阈值告警可触发

## 3) Debug · 陌生故障定位

```js
// 用户报告：应用跑 24 小时后，渲染进程内存从 80MB 涨到 1.2GB，越来越卡
// 简化版 renderer.js
const cache = new Map()

ipcRenderer.on('data:tick', (_e, payload) => {
  cache.set(payload.id, {
    payload,
    receivedAt: Date.now(),
    blob: payload.data  // ArrayBuffer
  })
})

// preload.js —— 漏了返回取消函数
contextBridge.exposeInMainWorld('api', {
  onData: (cb) => ipcRenderer.on('data:tick', (_e, p) => cb(p))
})
```

```js
// 另一段
window.addEventListener('beforeunload', () => {
  // 没清理 cache
})
```

请：
1. 列出至少 3 个内存增长源
2. 每个源给出最小修复
3. 解释为什么「靠 GC 回收」在这个例子里无效

### 通过标准

- 增长源 1：cache 无限增长，无淘汰策略
- 增长源 2：事件订阅没返回取消函数，闭包持有 payload 引用
- 增长源 3：blob/ArrayBuffer 不被 GC 主动回收（属于外部内存）
- 修复：LRU 缓存 + 上限；订阅返回取消函数 + 路由切换时调用；显式 `cache.delete(id)` 或定期清理过期
- 解释：这些对象都还被活跃引用，GC 不会回收；属于「该死没死」

## 4) Transfer · 同机制换约束

**场景**：把内存监控从主进程侧换成 UtilityProcess 侧：
- 起一个 UtilityProcess 专门跑 `app.getAppMetrics()` 采样
- 主进程只接收它回报的数据
- 优势是什么？需要付出什么代价？

### 通过标准

- 优势：主进程事件循环不被 `getAppMetrics` 的同步轮询影响（虽然 API 本身是同步的，CPU 占用低但可避免主进程阻塞风险）
- 代价：进程间通信的结构化克隆成本、需要管 UtilityProcess 生命周期