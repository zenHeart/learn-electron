# 调试体系

> **一句话本质**：Electron 是一组进程，调试的第一步永远是「先确定问题活在哪个进程」，然后才谈工具——每个进程有自己的调试通道，用错通道一无所获。

读完本章你会获得：一张分进程调试地图（主进程 / 渲染进程 / GPU 与子进程 / 网络层）、一套生产包远程调试手法（用户机器上也能开调试）、GPU trace 采集的完整配置与 Perfetto 分析法，以及线上问题的五步定位流程。

## 心智模型：分进程调试地图

| 症状 | 问题进程 | 主战工具 |
|---|---|---|
| 点按钮没反应、所有窗口冻结 | 主进程阻塞 | `--inspect-brk` + chrome://inspect |
| 页面白屏、JS 报错、UI 卡顿 | 渲染进程 | DevTools / `--remote-debugging-port` |
| 花屏、黑块、视频崩溃、滚动卡死 | GPU 进程 | `--trace-config-file` + Perfetto |
| 请求失败、加载慢、证书问题 | 网络服务进程 | `--log-net-log` + NetLog Viewer |
| 原生模块崩溃 | 各种子进程 | minidump + 崩溃上报（见[监控章节](/guide/18-observability)） |

**先定范围再动手**：一个「卡」可能是主进程阻塞（IPC 全堵）、渲染进程长任务（只有本窗口卡）、或 GPU 合成阻塞（动画掉帧但鼠标事件正常）。判断顺序：全部窗口卡 → 主进程；单窗口卡 → 渲染进程；画面卡但可交互 → GPU。

## 线上问题五步定位流程

来自生产环境的通用排障骨架，适用于一切「用户报障」类问题：

1. **定位模块**：结合截图/描述 + 行为日志，先把问题框到具体模块与窗口。
2. **代码 + 日志交叉**：带着模块上下文读代码，用日志时间线证实或证伪猜想。
3. **强制复现 + 确定进程范围**：本地通过改状态、改配置强制复现；同时明确问题属于主进程 / 渲染进程 / GPU——**范围判断错误，后面全部白费**。
4. **修复 + 补日志**：不确定根因时，先补日志上线采集证据，再修。
5. **监控闭环**：修复后补上对应的监控与告警，确保同类问题下次提前暴露而不是靠用户报障。

## 主进程调试

### 开发环境：VS Code launch.json

```json
{
  "type": "node",
  "request": "launch",
  "name": "Electron Main",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "runtimeArgs": ["--inspect=5858", "."],
  "skipFiles": ["<node_internals>/**"]
}
```

官方指南：[Debugging the Main Process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)。

### 生产包：inspect 通道任何时候都在

已安装的未打包应用（生产 exe）同样接受调试开关——这是远程排障的核心武器：

```powershell
# Windows：让主进程停在第一行等调试器接入
.\your-app.exe --inspect-brk=5858
```

1. 本机或远程打开 Chrome 访问 `chrome://inspect`
2. 「Configure」添加网络目标 `localhost:5858`（远程机器配合 SSH 隧道 `ssh -L 5858:localhost:5858 user@host`）
3. attach 后可断点、可看主进程内存、可执行时观察

::: exp 实战经验
生产包调试不必改任何代码：所有 `app.commandLine.appendSwitch` 能做的事，用户在快捷方式加参数同样能做。给测试团队一个「调试参数速查卡」，能省掉大量「无法复现」的来回。另一个技巧：生产环境难以开 DevTools 时，让主进程执行一段注入代码批量开调试窗：
```js
// 通过 --eval 或调试器 console 执行
BrowserWindow.getAllWindows().forEach(w => w.webContents.openDevTools({ mode: 'detach' }))
```
:::

## 渲染进程调试

```powershell
.\your-app.exe --remote-debugging-port=8315
```

浏览器访问 `http://localhost:8315`，列出所有渲染目标（页面、iframe、worker），点击即进入该页面的完整 DevTools。

::: pitfall 坑位警报
如果应用内部还要用 `webContents.debugger`（Sentry 部分能力、性能采集工具走 CDP），与 DevTools 是**独占互斥**的——线上排查需要开 DevTools 时，先禁用占用 debugger 的采集模块，排查完再恢复。用状态机串行化 debugger 的启用/禁用，避免竞态。
:::

## GPU 与子进程：trace 采集

GPU 进程没有 DevTools，mojo IPC 阻塞、blink 内存细节这类「非主线程问题」的主战场是 **Chromium trace**。

### 三步采集

```text
1. 应用目录放 trace-config.json（文件名固定，不认其他名字——这是个真实的坑）
2. 启动：your-app.exe --trace-config-file=./trace-config.json
3. 复现问题 → 关闭应用 → 产物 json 导入 https://ui.perfetto.dev/
```

### 生产级配置模板（异常现场捕获）

```json
{
  "startup_duration": 0,
  "result_file": "./gpu-crash-trace.json",
  "trace_config": {
    "record_mode": "record-continuously",
    "trace_buffer_size_in_kb": 300000,
    "enable_systrace": false,
    "included_categories": ["*"],
    "excluded_categories": [
      "loading", "net", "netlog", "disk_cache", "browser.navigation",
      "navigation", "service_worker", "passwords", "blob", "indexeddb",
      "leveldb", "audio"
    ],
    "included_categories_explicitly": [
      "gpu", "viz", "cc", "media", "webrtc", "toplevel", "latency",
      "latencyInfo", "benchmark", "input", "mojom", "ipc", "browser",
      "blink", "blink.user_timing", "scheduler", "sequence_manager", "v8",
      "disabled-by-default-gpu.service",
      "disabled-by-default-gpu.device",
      "disabled-by-default-gpu.decoder",
      "disabled-by-default-viz.quads",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.frame"
    ],
    "memory_dump_config": {
      "triggers": [
        { "mode": "light", "periodic_interval_ms": 1000 },
        { "mode": "detailed", "periodic_interval_ms": 10000 }
      ]
    }
  }
}
```

配置逐项解读：

- `record_mode: record-continuously`：**循环覆盖**模式，缓冲区满自动覆盖最旧数据——适合「等异常出现」的场景，应用平时就一直录着，异常发生的瞬间现场就在缓冲区里。
- `excluded_categories`：先把噪音类目（网络、存储、导航）排除，否则缓冲区全是无用数据。
- `memory_dump_config`：定期内存快照——light（1s）只统计总数几乎零开销，用来看趋势；detailed（10s）遍历对象较重，用于定位泄漏点。排查 OOM 的核心数据源。
- 只想分析内存时用极简配置：`included_categories: ["disabled-by-default-memory-infra"]` + 更高频的 dump。

::: pitfall 坑位警报
trace 的可用 category 与 Chromium 版本强相关。`included_categories_explicitly` 里的名字不认识时，去当前 Electron 对应的 Chromium 版本源码查证：`base/trace_event/builtin_categories.h`（例：Electron 22.x 对应 Chromium 108，就看 tag 108.0.5359.215 的这个文件）。写了不存在的 category 不会报错，只是静默采不到。
:::

### trace 录制纪律

- 单次录制 ≤ 10 秒——Perfetto 处理长 trace 极慢，信息密度也低。
- 一次只聚焦一个问题。
- 录异常场景前后各留一段正常数据做对照（正常 vs 异常的轨道差异就是线索）。

### Perfetto 分析入门

导入后在轨道区关注：

- **Memory 轨道**：GPU 进程内存是否「阶梯式只升不降」——纹理/显存泄漏的典型形态。
- **CrGpuMain 线程**：长切片（>16ms 掉帧、>100ms 明显卡顿）、`GpuChannelMsg_FlushCommandBuffers` 堆积。
- **渲染进程 Main / Compositor**：`GestureScrollUpdate` 是否被 JS/Layout 阻塞；Compositor 是否在等 SwapBuffers（GPU 瓶颈的信号）。

深度分析方法见[案例库 · GPU 崩溃五步分析法](/guide/cases/02-gpu-crash)。

## 网络层调试

```powershell
.\your-app.exe --log-net-log=netlog.json
```

复现后把 `netlog.json` 拖进 [NetLog Viewer](https://netlog-viewer.appspot.com/#events)：每个请求的完整生命周期（DNS / TCP / TLS / 缓存命中 / 证书链 / HTTP/2 帧级别）。白屏类问题先看这里——「加载了什么、卡在哪一步」一目了然。

## 应用日志

```powershell
.\your-app.exe --enable-logging --log-file=./app.log
```

输出 Chromium 层 + 主进程 console 到文件。配合 `--v=1` 可提级 verbosity。排查「日志回捞」体系见[监控章节](/guide/18-observability)。

## 常备工具箱

| 需求 | 命令/工具 |
|---|---|
| 看帧率与 GPU 内存 | `--show-fps-counter` |
| asar 内容检查 | `npx @electron/asar extract app.asar out/` |
| GPU 状态诊断 | 应用内打开 `chrome://gpu`（可写脚本采集 JSON） |
| GPU 合成基准 | `--enable-gpu-benchmarking` 开启 `chrome.gpuBenchmarking` API |
| 抓取崩溃 dump | `app.setPath('crashDumps', ...)` + Crashpad（见监控章节） |
| 命令行开关速查 | [附录 · 命令行速查](/appendix/cli-reference) |

## 延伸阅读

- [Application Debugging](https://www.electronjs.org/docs/latest/tutorial/application-debugging) —— 官方调试总览
- [Debugging the Main Process](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)
- [Perfetto UI](https://ui.perfetto.dev/) —— trace 分析器
- [Chromium trace-event 文档](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/)
- [NetLog Viewer](https://netlog-viewer.appspot.com/#events)
- [DevTools Extensions](https://www.electronjs.org/docs/latest/tutorial/devtools-extension)
