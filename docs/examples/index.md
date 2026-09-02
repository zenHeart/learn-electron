# Examples 跟学用例

> **一句话定位：12 个复制即跑的迷你应用，每个只讲一件事——它们是书里各章代码的「可执行版」，按难度递进排列。**

每个用例都是完整自包含的小项目：页面里给出全部代码（`package.json` / `main.js` / 需要时加 `preload.js` / `index.html`），不需要下载仓库，复制到本地就能跑。

## 怎么跟学

**第一步：跑起来。** 新建空目录，按用例页面创建文件，然后：

```bash
npm install electron   # 国内网络先设镜像，见 06 章「安装」一节
npm start
```

**第二步：改一改。** 每个用例末尾都有「动手改造」题——不亲手改代码的 Electron 学习会退化为阅读，而 Electron 的坑只有跑过才长记性。

**第三步：回书里对答案。** 每个用例都标注关联章节，改造时卡住或想知其所以然，回到对应章节。

三个跟学建议：

1. **按编号顺序走前三个**（01 → 03），它们是[06 章](/part2-core/06-first-app)的配套练习；之后可以按兴趣跳。
2. **出问题先想进程**——行为诡异时，先分清代码在主进程还是渲染进程，再看该刷新还是重启（06 章「代码热边界」）。
3. **主进程的 `console.log` 打在终端里，渲染进程的报错在 DevTools 里**——两个日志世界，别找错地方。

## 用例地图

| # | 用例 | 你将学到 | 关联章节 | 难度 |
| --- | --- | --- | --- | --- |
| 01 | [最小窗口](/examples/01-hello/) | 三件套骨架：main 字段、whenReady、loadFile | [06 · 第一个应用](/part2-core/06-first-app) | ★ |
| 02 | [生命周期观察](/examples/02-lifecycle/) | window-all-closed / activate 的平台差异，亲手触发一遍 | [05 · 生命周期](/part1-background/05-lifecycle) | ★ |
| 03 | [preload 与第一次 IPC](/examples/03-preload-ipc/) | contextBridge + invoke/handle，按钮调起系统对话框 | [06](/part2-core/06-first-app) / [09 · IPC](/part2-core/09-ipc) | ★★ |
| 04 | [右键菜单](/examples/04-context-menu/) | 主进程 Menu + IPC 弹出原生右键菜单，双向消息 | [11 · 系统能力](/part2-core/11-system) | ★★ |
| 05 | [记住窗口位置](/examples/05-window-state/) | 状态持久化：userData、最大化陷阱、离屏校验 | [07 · 窗口体系](/part2-core/07-windows) | ★★★ |
| 06 | [托盘常驻](/examples/06-tray/) | Tray 引用防 GC、关闭≠退出、内嵌图标 | [11 · 系统能力](/part2-core/11-system) | ★★★ |
| 07 | [系统通知](/examples/07-notification/) | 主进程 Notification 与 Windows AppUserModelID 坑 | [11 · 系统能力](/part2-core/11-system) | ★★ |
| 08 | [用户数据读写](/examples/08-file-io/) | userData 目录、tmp+rename 原子写 | [12 · 存储架构](/part2-core/12-storage) | ★★★ |
| 09 | [给自己窗口截图](/examples/09-capture-page/) | webContents.capturePage、NativeImage 转 PNG | [08 · 截屏](/part2-core/08-screenshot) | ★★ |
| 10 | [Deep Link 协议](/examples/10-open-url/) | setAsDefaultProtocolClient、两平台机制差异 | [11 · 系统能力](/part2-core/11-system) | ★★★ |
| 11 | [单实例锁](/examples/11-single-instance/) | requestSingleInstanceLock、第二实例参数转交 | [05 · 生命周期](/part1-background/05-lifecycle) | ★★ |
| 12 | [主进程网络请求](/examples/12-net/) | net.fetch、为什么请求放主进程、错误跨 IPC 传播 | [09 · IPC](/part2-core/09-ipc) | ★★ |

难度含义：★ 复制即跑，看注释能懂；★★ 需要理解 IPC 三件套；★★★ 涉及状态管理与平台差异，建议先读关联章节。

所有用例基于 **Electron 34+ 默认安全配置**（`contextIsolation` / `sandbox` 开启，`nodeIntegration` 关闭）——任何教程教你写 `nodeIntegration: true`，直接判定为过时内容。
