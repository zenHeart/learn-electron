# electron-testing · 测试实践探针

## 1) Explain · 闭卷 3 题

**Q1**：解释「三层测试策略」——单元 / 集成 / E2E——各自的测什么、工具、速度。

**Q2**：为什么 Electron 测试必须区分「主进程逻辑」「跨进程契约」「完整用户路径」三种测法？把它们压成一种测试会有什么问题？

**Q3**：Playwright `_electron.launch()` 启动真实应用后，`app.evaluate(fn)` 里的 `fn` 是在哪个上下文执行的？它能访问什么、不能访问什么？

### 通过标准

- Q1：单测 = 纯函数 / 工具逻辑（Vitest ms 级）；集成 = 真实进程 + IPC + 窗口契约（Playwright _electron s 级）；E2E = 安装包 + 用户流（分钟级）
- Q2：主进程纯逻辑走单测便宜；窗口 / IPC / 启动契约必须真实进程；安装包签名 / 升级链只有真包能验；压成一种 = 全部走 E2E 又慢又脆，或全部走 mock 又测不到真实 IPC
- Q3：在主进程 Node 上下文执行，能访问 `BrowserWindow`、`ipcMain` 等真实 Electron API；不能访问渲染进程的 window/document

## 2) Perform · 新起点最小任务

**任务**：为一个「单实例 + 主窗口 + IPC 读 version」的应用写集成测试：
- 验证 `_electron.launch()` 后能拿到第一个窗口
- 验证 `app.evaluate` 能取到 `BrowserWindow.getAllWindows().length === 1`
- 验证渲染进程能调 `window.api.getVersion()` 拿到版本字符串
- 用 `app.close()` 收尾

### 通过标准

- 三个断言都通过
- 测试在 CI 上能跑（无显示器环境不报 `Missing X server`）

## 3) Debug · 陌生故障定位

```js
// tests/app.spec.js
const { test, expect, _electron } = require('@playwright/test')

test('主窗口存在', async () => {
  const app = await _electron.launch({ args: ['main.js'] })
  const win = await app.firstWindow()
  // 假设用户写了下面这条断言
  const count = await win.evaluate(() => document.querySelectorAll('.item').length)
  expect(count).toBeGreaterThan(0)
})
```

**问题**：测试不稳定，本地偶尔通过、CI 上总是 fail。

请：
1. 列出 3 个可能原因
2. 每个原因给出最小修复
3. 解释为什么 `_electron.launch()` 后直接断言 DOM 元素是反模式

### 通过标准

- 可能原因 1：渲染层异步加载（HTML 加载完不等于 JS 执行完）
- 可能原因 2：测试未等 ready-to-show 就断言
- 可能原因 3：CI 上 time-zone / locale 差异导致内容变化
- 修复：等 `domcontentloaded` / 用 `waitForSelector('.item')`；增加超时容忍；测试数据用固定 fixture
- 反模式：刚启动就断言可能还在空白页；正确是显式等目标元素出现

## 4) Transfer · 同机制换约束

**场景**：把集成测试改成「跨版本矩阵」——同一份测试在 Electron 27 / 28 / 29 / 30 四个版本上都跑一遍。

Playwright 配置怎么改？需要在每个版本跑前做什么准备？

### 通过标准

- `playwright.config.js` 用 `projects` 或 `matrix` 配置多 Electron 版本
- 每个版本装对应 electron 二进制；可放 fixture 工程目录或临时 `npm i electron@<ver>`