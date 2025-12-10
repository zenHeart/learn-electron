# GPU 与 WebRTC 问题 Trace 分析指南

本指南旨在帮助你分析 Electron/Chrome 生成的 Trace 文件（`.json` 或 `.gz`），以定位性能瓶颈和崩溃原因，特别关注 WebRTC 和 GPU 的交互场景。

## 1. 分析工具

- **Perfetto UI（推荐）**: [https://ui.perfetto.dev/](https://ui.perfetto.dev/) - 现代化的工具，速度更快，对大文件处理更好。
- **Chrome Tracing（传统）**: 在 Chrome 浏览器中输入 `chrome://tracing`。

## 2. GPU 崩溃分析策略

当遇到 "视频 + 滚动 = GPU 崩溃" 的情况时，我们主要寻找 **资源耗尽（内存）** 或 **管线阻塞（长耗时任务）**。

### 第一步：检查内存使用（崩溃的关键）

GPU 崩溃通常是由 OOM（内存溢出）引起的。

1.  在 Perfetto/Chrome Tracing 中打开 trace 文件。
2.  寻找 **Memory** 轨道（如果开启了 `memory-infra`）。
3.  找到 **GPU Process** 的内存。
    - **迹象**: 滚动期间，内存曲线是否呈现 "阶梯式" 上升（只升不降）？
    - **细节**: 查看 `shared_memory` 或 `gpu/gl/textures`。
    - **分析**: 如果视频纹理在滚动过程中没有被正确回收（例如，每一帧都创建新纹理而未释放旧的），显存（VRAM）会被填满，从而触发崩溃。

### 第二步：检查 GPU 进程

1.  定位到 **GPU Process** 轨道。
2.  寻找 **CrGpuMain** 线程。
3.  **危险信号**:
    - **长耗时任务**: 是否有超过 16ms（甚至更长，如 100ms+）的任务条？
    - **`GpuChannelMsg_FlushCommandBuffers`**: 如果这个耗时过长，说明渲染进程在等待 GPU。
    - **`GpuVideoDecoder` / `FFmpegVideoDecoder`**: 检查滚动期间解码任务是否重叠或耗时异常。

### 第三步：分析渲染进程（主线程与合成器）

1.  定位到承载视频的 **Renderer Process**。
2.  **Main Thread（主线程）**:
    - 寻找 `UpdateLayerTree`, `Composite`, 或 `Layout` 事件。
    - **滚动时**: `InputLatency::GestureScrollUpdate` 事件应该很频繁。如果它们被长时间的 JavaScript 执行或 Layout 抖动（Layout thrashing）阻塞，会导致卡顿，但通常不会直接导致 GPU 崩溃，除非触发了大量的纹理上传。
3.  **Compositor Thread（合成器线程）**:
    - 寻找 `CompositorFrameSink::SubmitCompositorFrame`。
    - 如果 GPU 不堪重负，你可能会看到合成器在等待 `SwapBuffers`。

### 第四步：WebRTC 与视频细节

1.  搜索 **`webrtc`** 或 **`media`** 事件。
2.  **`appendBuffer`**: 由于你使用 `appendBuffer` (MSE 等方式)，寻找 `SourceBuffer::appendBuffer`。
3.  **纹理上传**: 寻找 `GpuOneCopy` 或 `ZeroCopy`。
    - **问题**: 如果滚动触发了布局变化，强制视频元素频繁调整大小或重绘，Chrome 可能会在每一帧都将视频纹理重新上传到 GPU。这是非常昂贵的操作，可能导致 OOM。

### 第五步：定位崩溃点

1.  滚动到 trace 的 **末尾**（或记录停止的地方）。
2.  **上下文丢失**: 搜索 `GpuChannelHost::OnContextLost` 或 `GpuProcessHost::OnProcessCrashed` 等事件。
3.  **看门狗（Watchdog）**: 如果 GPU 线程被阻塞太久（通常是 10 秒+），**GPU Watchdog** 会将其杀死。在 GPU 进程的末尾寻找一个非常长的任务。

## 3. 常见修复方案

- **CSS `will-change: transform`**: 确保视频容器拥有独立的合成层，防止滚动时重绘。
- **虚拟滚动（Virtual Scrolling）**: 如果有大量视频，确保只有可见的视频处于活跃状态。
- **硬件加速**: 检查 `app.disableHardwareAcceleration()`（通常不建议生产环境使用，但可用于测试验证）是否能阻止崩溃。
- **驱动问题**: 更新显卡驱动。

## 4. 示例工作流

1.  加载 `gpu-crash-trace.json`。
2.  在搜索栏输入 `memory` (Perfetto) 或寻找 "Memory" 计数器 (Legacy)。
3.  观察 **GPU Memory** 曲线。
4.  放大到你开始滚动的那个时间段。
5.  如果内存平稳但 GPU 任务耗时很长 -> **处理瓶颈**。
6.  如果内存飙升 -> **泄漏/OOM**。
