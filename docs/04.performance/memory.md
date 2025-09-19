# memory

## 背景

oom 错误在 electron 中崩溃中占比较高 除了本地调试采集 oom 数据外，还需要建立常态化指标监控应用的内存消耗重点解决如下问题通过常态化内存监控，确保引用内存不劣化,通过 oom 异常是采集，方便定位内存溢出的具体原因

## 采集支持的 API

现有 electron 支持的 api 列表如下，注意使用的 electron 版本，可以在调试模式下，在控制台通过 process.versions 查看 electron 对应的相关依赖版本信息

### node 底层 api

#### [process.constrainedMemory()](https://nodejs.org/api/process.html#processconstrainedmemory)

用于获取进程是否存在内存限制，由于当前应用使用的 electron 版本为 22.3.27 node 为 16.17.1 暂时不支持这个 api

#### [process.resourceUsage()](https://nodejs.org/api/process.html#processresourceusage) 当前进程所使用的资源

#### [process.memoryUsage()](https://nodejs.org/api/process.html#processmemoryusage) node 进程使用内存

- heapUsed/heapTotal 可以看出 v8 内存是否告警
- rss 是系统层面整个 node 进程的内存消耗，意义不大

具体含义详见 <https://stackoverflow.com/questions/12023359/what-do-the-return-values-of-node-js-process-memoryusage-stand-for>

#### [process.memoryUsage.rss()](https://nodejs.org/api/process.html#processmemoryusagerss)

和 memoryUsage 返回的 rss 值一样，只是更快

#### [v8.getHeapStatistics()](https://nodejs.org/api/v8.html#v8getheapstatistics)

v8 详细使用内存

#### [v8.GCProfiler](https://nodejs.org/api/v8.html#class-v8gcprofiler)

显示 GC 相关信息用来定位 memroy 问题

##### [process.on('warning',xxx)](https://nodejs.org/api/process.html#nodejs-warning-names)

监控 MaxListenersExceededWarning 错误， 可以通过此进程监听避免挂载太多 listners 问题

### 主进程

#### [process.getSystemMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetsystemmemoryinfo)

返回系统使用的物理内存, 重点关注

- **swapFree** 改值反应了系统内存压力情况，如果 swapFree/swapTotal 较大，说明系统存在内存压力

#### [app.getAppMetrics](https://www.electronjs.org/docs/latest/api/app#appgetappmetrics)

返回所有进程的内存信息，个内存对象结构如下 [ProcessMetric](https://www.electronjs.org/docs/latest/api/structures/process-metric) 包含的关键信息为

- **pid** 进程 id
- **type** 进程类型，重点关注
  - **Browser** 主进程
  - **Tab** 渲染进程
- **cpu** 各进程 cpu 使用率，详见 [CPUUsage Object](https://www.electronjs.org/docs/latest/api/structures/cpu-usage)
  pid 进程编号
- **creationTime** 进程创建时间，注意由于 pid 存在复用可能，所以通过 pid+creationTime 作为进程独立标识符更为稳妥
- **memory** [memory](https://www.electronjs.org/docs/latest/api/structures/memory-info) 由于系统会存在内存压缩逻辑，所以改值不能真实的映射资源管理器中内存字段, 会比实际存贮的内存要大，包含的核心字段如下
  - **workingSetSize** 实际使用的物理内存 = 共享内存 + 私有内存，为资源管理器中实际内存列
  - **peakWorkingSetSize** 峰值使用的物理内存
  - **privateBytes** 峰值使用的物理内存

#### [process.getProcessMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetprocessmemoryinfo)

返回的对象结构 [ProcessMemoryInfo](https://www.electronjs.org/docs/latest/api/structures/process-memory-info) 返回进程的内存信息， **渲染进程也可利用此 API 获取**

- **private** 改值反映了进程私有内存实际大小和采用资源管理看到的内存基本一致，用改值来评估主进程和渲染进程的时机消耗

### 渲染进程

除了支持主进程和 node API 外，渲染进程额外支持如下 API

#### [process.getBlinkMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetblinkmemoryinfo)

- **allocated** blink 消耗内存，单位 KB, 用来定位 dom 相关内存问题
- **total** blink 分配的内存大小，注意 total 不占用实际内存，只是 blink 引擎预估的内存量，会动态变化

#### [process.getHeapStatistics](https://www.electronjs.org/docs/latest/api/process#processgetheapstatistics)

返回 v8 的堆内存信息，核心内容

- **usedHeapSize** 单位 KB ，返回堆内存使用量

#### [webFrame.getResourceUsage](https://www.electronjs.org/docs/latest/api/web-frame#webframegetresourceusage)

查看资源缓存大小，定位是否存在缓存 oom 问题

[MemoryUsageDetails](https://www.electronjs.org/docs/latest/api/structures/memory-usage-details)

#### performance

- [performance.memory.usedJSHeapSize](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)

## 内存组成说明

参考 chromium [内存模型](https://www.chromium.org/developers/memory-usage-backgrounder/) 进程包含内存包含三个部分

**private working set** 进程单独占有的内存

**sharable working set** 与其他进程可共享的内存

**shraed working set** 已共享的内存空间，是可共享内存的子集

由于 chrome 多进程架构，在计算一个应用总内存的时候如果考虑共享内存会出现重复计算，所以重点关注每个独立进程的 private working set 来作为进程内存基准

该值可以通过 [process.getProcessMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetprocessmemoryinfo) 返回的对象的 private 字段表征，所以进程大小用此值进行预估，对于各种进程获取该值原理如下

主进程/渲染进程 ，由于都存在 process 变量，所以直接消费改值即可

GPU/Utils 进程，由于该进程应用一般无法控制，暂时不关注，可以通过[app.getAppMetrics](https://www.electronjs.org/docs/latest/api/app#appgetappmetrics) 返回的 meory 字段预估，其中

windows 使用 privateBytes 关注私有内存

mac 关注 workingSetSize, 注意由于存在内存压缩所以此值相比资源管理器中的内存占有会大

对于出现进程问题时，需要分析详细内存时，不同进程的内存组成也有差异，这里重点关注主进程和渲染进程

主进程内存组成

## 采集策略

为了降低应用因为整体内存引发的崩溃实际上包括三大块内容 实际上性能监控也可以这么做

**常态化监控，**上线后常态化的内存水位,通过常态化监控，确保在应用长期迭代过程中不出现增量劣化，使整体应用长期维持在一个预期水位

**异常采集**，应用异常时，可以捕获详细的内存使用信息辅助定位内存问题，这里需要保证收集的准确性和内存细分的粒度

**准入预检**，在完成 1,2 能力后，就可以通过前置预检脚本，结合自动化手段判断解决如下问题

检测主进程和渲染进程是否存在 oom 风险，扫描出可能存在的 memory leak 场景

类似工具参考 [https://facebook.github.io/memlab/](https://facebook.github.io/memlab/)

避免新版本的内存水位是否超过基准水位，避免劣化

[CovalenceConf 2019: Visual Studio Code – The First Second](https://www.youtube.com/watch?v=r0OeHRUCCb4)

### 1. 常态化监控

主要涉及两个点

采集的准确性，需要确保收集的信息能够正常反应应用此时真实应用内存使用情况

通过 [process.getProcessMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetprocessmemoryinfo) 获取主进程和渲染进程内存信息，基本和资源管理器看到的一致

通过 app.getAppMetrics 捕获其他进程信息，和资源管理器不一致，但是基本可用，这也不是导致 oom 的主要原因

采集的触发条件，需要确保采集不会影响主进程和渲染进程的正常使用
，窗口存活时间中位数 4h ，设置间隔基本可以保证多次采样

主进程轮训 5min

渲染进程轮训 10min

### 2. 异常采集

细粒度内容， 除了常规内存信息还包含

主进程

[process.getSystemMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetsystemmemoryinfo) 系统内存信息

[process.resourceUsage()](https://nodejs.org/api/process.html#processresourceusage) 当前进程所使用的资源只有主进程统计资源占用信息

[process.getHeapStatistics](https://www.electronjs.org/docs/latest/api/process#processgetheapstatistics) v8 堆栈信息

渲染进程

[webFrame.getResourceUsage()](https://www.electronjs.org/docs/latest/api/web-frame#webframegetresourceusage) 详细各种类型资源占用

[process.getBlinkMemoryInfo](https://www.electronjs.org/docs/latest/api/process#processgetblinkmemoryinfo) 渲染进程，包含 blink 内存信息，主要是 dom 节点内存

[process.getHeapStatistics](https://www.electronjs.org/docs/latest/api/process#processgetheapstatistics) v8 堆栈信息

采集的触发条件，需要确保采集不会影响主进程和渲染进程的正常使用

主进程 ，onCaughtException 包含 memory 事件

child-process-gone 中 oom 事件

render-process-gone 中 oom 事件

阈值检测，只要主进程或渲染进程在轮训采集中超过某个阈值自动触发详细信息采集

主进程 50MB , 后续通过监控 P90 确定

渲染进程 300MB，后续通过监控 P90 确定

### **3. 准入预检**

TODO 参考 sentry-electron e2e test 采集异常

### 核心流程

## 其他注意事项

### 多开情况采集检测

通过 [getAppMetrics](https://www.electronjs.org/docs/latest/api/app#appgetappmetrics) 可以识别渲染进程各数判断多开，由于多开主要压力在主进程，这里需要在主进程上标记当前渲染进程各数作为后续看板分类依据，渲染进程单独采集不区分多开场景

多开用户占比 25%

多开数量中位数 2， P90 5, 最多对开数量不超过 80

### 轮训对主进程影响

重点需要检测场景

1 个开启 appUsage 上涨情况，和未开启检测对比

常规 5 个多开的时候 appUsage 上涨情况和未开启及 1 个对比检测对比

峰值 80 个多开的时候，和未开启及 1,2 对比

### 进程采集精度

**工具进程** 主机进程出现请求调用或者通知触发等逻辑，会临时唤起 render 和 utils service 进程，暂时不考虑这些进程的准确性，目前利用 [getAppMetrics](https://www.electronjs.org/docs/latest/api/app#appgetappmetrics) 获取其他进程信息，在 mac 下无法准确获取压缩后内存，由于在 oom 中占比极低，暂时不考虑获取压缩内存方法

**渲染进程包含 iframe 的细节内存分析** 打开 iframe（例如商详页面）等时，暂时为细究这些是否可通过 [webFrame.getResourceUsage](https://www.electronjs.org/docs/latest/api/web-frame#webframegetresourceusage) 获取，后续考虑，同时也会触发临时的 renderer 进程


## debug

```js
# collect memory info
require('v8').getHeapSnapshot().pipe(require('fs').createWriteStream(`${process.env.HOME}/Desktop/snap.heapsnapshot`))
```



## 参考资料

- [electron weak reference](https://www.electronjs.org/blog/electron-internals-weak-references) 详解主进程和渲染进程由于 ipc 导致的内存溢出
- [新 QQ NT 桌面版如何实现内存优化探索](https://mp.weixin.qq.com/s/STqlp2eMdeoixedCEhYJgQ)
- [bilibili 客户端技术](https://www.bilibili.com/read/cv22750308/)
- [mac 活动监视器内存解读](https://support.apple.com/zh-cn/guide/activity-monitor/actmntr1004/mac)
- [理解进程内存](https://www.ihewro.com/archives/1277/)
- [mac os memory](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/ManagingMemory/Articles/AboutMemory.html)
- [integrity level](https://book.hacktricks.xyz/windows-hardening/windows-local-privilege-escalation/integrity-levels)
- [chromium 内存核心概念](https://source.chromium.org/chromium/chromium/src/+/main:docs/memory/key_concepts.md)
- [blink memory detail](https://docs.google.com/presentation/d/1soWvmqxWuZQ_ZchvPZFgf5frAQBBlq5f2tJTuDDPZI8/edit#slide=id.ge29dfb420_1_594)
- [memory usage](https://chromium.googlesource.com/chromium/src.git/%2B/master/docs/memory/tools.md)
- [oom preload inject](https://www.notion.so/oom-preload-inject-1526c4b965cb8012be8efcbca4c6216e?pvs=21)
- [chromium memory debug](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/memory)
- [chromium memory architecture](https://www.chromium.org/developers/memory-usage-backgrounder/)
- [memory 内存使用说明](https://chromium.googlesource.com/chromium/src/+/main/docs/memory-infra/README.md)
- [memory dump](https://docs.google.com/presentation/d/1GI3HY3Mm5-Mvp6eZyVB0JiaJ-u3L1MMJeKHJg4lxjEI/present?slide=id.g99496a710_0_87)
- [chrome tracing tool](https://blog.scottlogic.com/2019/05/21/analysing-electron-performance-chromium-tracing.html)
- [node 内存结构](https://zhuanlan.zhihu.com/p/70854476)
- [mac memory architecture](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/ManagingMemory/ManagingMemory.html#//apple_ref/doc/uid/10000160-SW1)
- [vmmap](https://learn.microsoft.com/en-us/sysinternals/downloads/vmmap)
- [linux process](https://man7.org/linux/man-pages/man5/proc.5.html)
- blink 内存分配资料
  - [内存结构图](https://docs.google.com/presentation/d/1ePz0Xbrxm0pyuDsgJrT-_y_VZqW6Ny4Cs64fvXobQIA/edit#slide=id.g99496a710_0_87)
  - [partitionAlloc design](https://chromium.googlesource.com/chromium/src/+/master/base/allocator/partition_allocator/PartitionAlloc.md)
- [gmail memory profile](https://web.dev/articles/effectivemanagement?hl=zh-cn)
- [google memory manage](https://developer.chrome.com/docs/devtools/memory)
  blog
- [memory profile](https://www.smashingmagazine.com/2012/11/writing-fast-memory-efficient-javascript/)
- [awsome js memory](https://github.com/svdokuchaev/awesome-js-memory?tab=readme-ov-file)
- [node memory debug](https://nodejs.org/en/learn/diagnostics/memory)
- [electron v8 profile](https://mp.weixin.qq.com/s/w49Q1bp2DAHE84cyCf8toA)
- [v8 memory](https://elvinn.wiki/nodejs/memory.html)
- [v8 memory blog](https://v8.dev/blog/tags/memory)
- [v8 memory leak debug](https://v8.dev/docs/memory-leaks)
- [nodejs memory](https://nodejs.org/en/learn/diagnostics/memory)
- [memory leak process in nodejs](https://techtldr.com/simple-guide-to-finding-a-javascript-memory-leak-in-node-js/)
- [node memory check](https://www.arbazsiddiqui.me/a-practical-guide-to-memory-leaks-in-nodejs/)
- [v8 memory debug](https://v8.dev/docs/trace)
- [v8 profile debug](https://v8.dev/docs/rcs)
- [window.open 优化](https://juejin.cn/post/7201856537534939191)
- [console.log memory leak](https://docs.ffffee.com/electron/electron-%E5%86%85%E5%AD%98%E6%B3%84%E6%BC%8F%E6%8E%92%E6%9F%A5.html)
- [reduce electron memory](https://www.reddit.com/r/electronjs/comments/14fiu0p/is_there_a_way_to_consistently_keep_my_electron/)
- [electron profile](https://brainhub.eu/library/electron-app-performance)
- [electron memory cage](https://www.electronjs.org/blog/v8-memory-cage)
- [vscode performance view](https://github.com/microsoft/vscode/blob/66d1df23f9f1ccbe83de2ca30e7fa8872ea62fbb/src/vs/workbench/contrib/performance/browser/perfviewEditor.ts#L178)
- [vscode performance issue](https://github.com/microsoft/vscode/wiki/Performance-Issues)
- [vscode test](https://github.com/microsoft/vscode/wiki/Writing-Tests)
- [vscode performance tool](https://github.com/microsoft/vscode/wiki/%5BDEV%5D-Perf-Tools-for-VS-Code-Development)
