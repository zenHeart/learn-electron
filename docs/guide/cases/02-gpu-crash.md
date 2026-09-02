# 案例 2：GPU 崩溃五步分析法——视频 + 滚动 = 花屏/崩溃

> 本案例是全站方法密度最高的一篇：「视频画面出现花屏、黑块，滚动时崩溃」。它演示了从现象到根因的完整 trace 取证流程，这套方法适用于一切 GPU/合成层问题。

## 现象

用户反馈：房间内有视频通话时快速滚动列表，出现花屏/黑块，偶发应用崩溃。低配机器与特定显卡驱动上概率显著更高。

## 五步分析法

采集配置见[调试章节 · GPU trace](/guide/15-debugging)（`record-continuously` 循环覆盖模式 + memory dump），用 Perfetto 打开崩溃前 30 秒的 trace。

### 第一步：查 Memory 轨道——GPU 进程内存曲线

看 GPU 进程的内存是否**阶梯式只升不降**（重点类别：`shared_memory`、`gpu.gl.textures`）。

- 判定：内存平稳 → 跳过第二步直接看任务长切片（处理瓶颈路线）；内存飙升 → 泄漏/OOM 路线，继续第二步。
- 本例：纹理内存随滚动帧数线性增长——**视频纹理在每一帧滚动时被重新上传**。

### 第二步：查 CrGpuMain 线程——长任务与命令堆积

- 找 Duration > 16ms（掉帧级）与 > 100ms（明显卡顿级）的切片；
- 关注 `GpuChannelMsg_FlushCommandBuffers` 是否密集堆积（渲染进程在疯狂提交绘制命令）；
- `GpuVideoDecoder` 切片与上传切片是否重叠（视频解码与纹理上传互相挤压）。

本例：滚动期间 FlushCommandBuffers 排队，解码与上传交错出现。

### 第三步：查渲染进程两个线程——阻塞在哪一侧

- **Main Thread**：`GestureScrollUpdate` 是否被 JS 长任务/Layout 阻塞（滚动掉帧的渲染侧原因）；
- **Compositor Thread**：是否在等 `SwapBuffers` 返回（GPU 瓶颈的标志——合成器把帧提交给 GPU 后等不到回应）。

判别口诀（**Wall Duration vs Thread Duration**）：

```text
切片 Duration（墙上时间）>> Thread Duration（实际占用 CPU 时间）
  → 在等待（被抢占 / 等锁 / 等 IO / 等 GPU）
Duration ≈ Thread Duration
  → 真的 CPU 瓶颈

特例指纹：SwapBuffers Duration 14s + Thread Duration 900µs
  → GPU hang / 驱动崩溃（屏幕冻结的典型形态），不是普通卡顿
```

### 第四步：webrtc / media 事件——数据怎么流的

沿时间轴找：`SourceBuffer::appendBuffer`、`GpuOneCopy/ZeroCopy`（纹理上传路径）、关键帧解码切片。回答「视频帧数据走了哪条路、在哪一环开始堆积」。

本例定位：视频元素未进独立合成层，滚动导致视口变化 → Chromium 每帧重新光栅化+重新上传视频纹理 → 显存与带宽双杀 → 低配机 OOM / 驱动崩溃。

### 第五步：定位崩溃点与「案发前倒推」

崩溃事件本身（`OnContextLost` / `OnProcessCrashed` / GPU Watchdog 超时杀进程——默认约 10s）只是**结果**。根因要在**挂起/崩溃前 100~500ms** 倒推：找超大纹理上传（GpuOneCopy 超大切片）、Shader 首次编译、视频关键帧解码这类「重事件」。

## 修复方案（按优先级）

```css
/* 1. 视频容器独立合成层：滚动时纹理不再每帧重上传 */
.video-tile {
  will-change: transform;
  /* 或 transform: translateZ(0) —— 用最小面积使用，合成层本身有内存成本 */
}
```

2. **长列表虚拟滚动**——DOM 数量是 Layout/光栅化的双重源头；
3. 验证法对照：`app.disableHardwareAcceleration()` 后现象消失 = GPU 链路问题实锤（确认诊断，不是修复手段）；
4. 用户侧缓解：提示更新显卡驱动（老驱动上 ANGLE/D3D bug 不在你的修复范围）；
5. 兜底（见[性能章节](/guide/16-performance)）：不能升级 Chromium 的存量客户端，用远程规则引擎对问题机型下发 GPU flag（如禁用 DirectComposition 视频叠加）。

## 速查表

| 现象 | 第一 suspects |
|---|---|
| 滚动掉帧，鼠标事件正常 | 渲染 Main Thread 长任务；纹理重上传 |
| 全窗口冻结几秒后恢复/崩溃 | GPU hang（SwapBuffers 长等待指纹） |
| 花屏/黑块 | 纹理内容错乱：DirectComposition overlay / 驱动 bug |
| 播放视频越久越卡 | 解码器资源泄漏；纹理内存只涨不降 |
| 特定机型才崩 | 机型 + 驱动版本聚类 → 规则引擎下发 flag |

## 预防

- 视频-heavy 界面设计阶段就规划合成层（`will-change`）与虚拟滚动，不要等事故后补。
- 崩溃上报里带上 GPU vendorId/deviceId/驱动版本（`app.getGPUInfo`）——机型聚类分析靠它。
- trace 录制纪律回顾：≤10 秒、单问题、异常前后留对照段。
