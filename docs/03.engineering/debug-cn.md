# Electron 调试指南

## 主进程调试

1. 进入 nn 应用目录
2. 使用检查模式启动应用：

   ```bash
   	.\nn.exe --inspect-brk=5858
   ```

3. 打开 Chrome 浏览器，访问 `chrome://inspect`
4. 在 Devices 菜单中选择 "Discover network targets"
5. 点击 Config 按钮，添加目标地址：`localhost:5858`
6. 此时会进入调试模式

生产方式可以通过此方式追加 switch 或者查看主进程内存等信息。

## 渲染进程调试

1. 进入 nn 应用目录
2. 使用远程调试端口启动应用：
   ```bash
   	.\nn.exe --inspect-brk --args --remote-debugging-port=8315
   ```
3. 在浏览器中打开：`http://localhost:8315`

4. 选择要调试的渲染进程页面进行调试

## GPU 等其他进程

1. 打开应用目录
2. 创建并配置 `trace-config.json` 配置含义如下

   - `startup_duration` 自动停止时间单位 s, 0 表示应用关闭才停止采集，2 表示只采集启动后 2s 数据
   - `result_file` 文件输出保存地址，一般采用相对路径，为运行命令目录对应的文件夹
   - `trace_config`

     - record_mode 配置采集模式，这里是循环覆盖，只要缓冲区满了就会覆盖，对于异常场景，采用此模式可以采集到异常信息
     - trace_buffer_size_in_kb 采集 30MB 数据
     - enable_systrace 是否开启内核级追踪， 这里默认关闭
     - included_categories 包含标准采集信息
     - excluded_categories 排除噪音
     - included_categories_explicitly 必须采集的内容，注意 trace 的配置需要结合 electron 依赖的 chromium 具体版本，当前 electron 22.3.27 依赖 chromium 108.0.5359.215， 该版本支持的配置详见 [chromium trace_event 代码](https://chromium.googlesource.com/chromium/src/+/refs/tags/108.0.5359.215/base/trace_event/builtin_categories.h)
     - memory_dump_config 含义 定期给内存拍“快照”，用于排查 OOM (Out of Memory) 导致的崩溃或显存泄漏。
       - light (每 1 秒): 轻量级快照，只统计总数，几乎不影响性能。用于看内存增长趋势。
       - detailed (每 10 秒): 详细快照，会遍历对象，比较耗时。

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
           "loading",
           "net",
           "netlog",
           "disk_cache",
           "browser.navigation",
           "navigation",
           "service_worker",
           "passwords",
           "blob",
           "indexeddb",
           "leveldb",
           "audio"
         ],
         "included_categories_explicitly": [
           "gpu",
           "viz",
           "cc",
           "media",
           "webrtc",
           "toplevel",
           "latency",
           "latencyInfo",
           "benchmark",
           "input",
           "mojom",
           "ipc",
           "browser",
           "blink",
           "blink.user_timing",
           "scheduler",
           "sequence_manager",
           "v8",
           "disabled-by-default-gpu.service",
           "disabled-by-default-gpu.device",
           "disabled-by-default-gpu.decoder",
           "disabled-by-default-viz.quads",
           "disabled-by-default-viz.surface_id_flow",
           "disabled-by-default-viz.gpu_composite_time",
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

3. 完成采集后关闭应用，采集数据会收录到配置的输出文件中，步骤 2 中配置输出为 gpu-crash-trace.json
4. 将配置导入到 [prefetto](https://ui.perfetto.dev/) 查看

trace 在调试非主线程的场景，作用很大，比如 mojo 阻塞，blink 引擎层面的 memory 细节，比 memory 面板可以看到更多信息，例如单纯分析内存

    ```json
    {
      "startup_duration": 30,
      "result_file": "./trace.json",
      "trace_config": {
        "included_categories": ["disabled-by-default-memory-infra"],
        "memory_dump_config": {
          "triggers": [
            { "mode": "light", "periodic_interval_ms": 50 },
            { "mode": "detailed", "periodic_interval_ms": 1000 }
          ]
        }
      }
    }
    ```

详细的 trace 使用参考 [traceing](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/)

## 网络日志

1. 开启网络采集

   ```bash
   electron.exe --log-net-log=netlog.json
   ```

2. 访问 [NetLog Viewer](https://netlog-viewer.appspot.com/#events)
3. 导入生成的 `netlog.json` 文件

详细信息请参考 [NetLog 分析指南](https://textslashplain.com/2020/04/08/analyzing-network-traffic-logs-netlog-json/)

## electron 应用日志输出

```bash
electron --enable-logging --log-file=electron.txt
```

这会在当前目录生成 `electron.txt` 文件，包含应用运行时的各项日志信息。
