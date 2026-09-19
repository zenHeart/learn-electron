# electron-packaging-builder · 打包配置探针

## 1) Explain · 闭卷 3 题

**Q1**：解释 asar 是什么、不是什么——为什么 `.node` 文件必须 `asarUnpack`？

**Q2**：macOS 上「签名」和「公证」是两件事吗？不做公证用户会遇到什么？做完签名但忘记 `hardenedRuntime` 又会发生什么？

**Q3**：`extraResources` 和 `files` 的区别是什么？给一个真实例子说明放错位置的后果。

### 通过标准

- Q1：asar 是单文件归档（Node 模块能直接从中读）；它不是加密也不是压缩；`.node` 必须 unpack 因为它是动态库，加载时需要真实文件路径
- Q2：签名是「证明这包是你发的」，公证是「Apple 云端扫过这包没发现问题」；不做公证 → 用户首次启动会被 Gatekeeper 拦截；忘了 `hardenedRuntime` → 公证阶段直接失败
- Q3：`files` 进 asar（应用代码）；`extraResources` 落到 `resources/` 目录（外部工具、预置文件）；把外部可执行文件错放 `files` → 找不到它（执行需要路径），把源代码错放 `extraResources` → 包体积膨胀且代码不进 asar 失去轻度保护

## 2) Perform · 新起点最小任务

**任务**：从零搭一个最小可打包的项目：
- 一个窗口，显示「hello」
- 一份 `electron-builder.yml`：mac/win/linux 三平台，NSIS + dmg + AppImage
- `.node` 原生模块正确 `asarUnpack`
- 一个 `build/bin/helper` 外部可执行文件正确 `extraResources`
- 跑 `pnpm dist:dir` 出未压缩目录并能启动

### 通过标准

- `electron-builder.yml` 三平台都覆盖
- `asarUnpack` 正确包含 `**/*.node`
- `extraResources` 包含 `build/bin`
- 跑 `dist:dir` 后产物能启动

## 3) Debug · 陌生故障定位

```yaml
# 用户报告：打包后启动报「Cannot find module 'xxx'」但开发模式正常
appId: com.example.app
productName: MyApp
files:
  - package.json
  - main/**/*
  - preload/**/*
  - renderer/**/*
  # 用户加了这一行想让构建更快
  - '!**/node_modules/**'
```

```js
// main.js 里 require 了 xxx
const xxx = require('xxx')  // 是个 npm 依赖
```

**问题**：开发模式（`electron .`）正常，打包后启动报 `Cannot find module 'xxx'`。

请：
1. 指出根因
2. 给出最小修复
3. 解释为什么有些团队会把某些大依赖 `extraResources` 出去

### 通过标准

- 根因：`!**/node_modules/**` 把所有 npm 依赖排除在产物外；asar 里就没有 `node_modules/xxx`
- 修复：删除这一行（默认 `files` 会包含 `node_modules`/运行时依赖）；或者改成白名单 `files: [..., '!node_modules/{dev-only}/**']`
- 解释：超大原生工具（ffmpeg、imagemagick）可 `extraResources` 出去，主包更新时不变，只需更新工具二进制

## 4) Transfer · 同机制换约束

**场景**：把上面任务的项目改成 Electron Forge 打包，写出等价的 `forge.config.js`，并解释两个工具在以下维度的差异：
- 配置位置（YAML vs JS）
- 多 maker 体系 vs 一份配置覆盖全平台
- 自动更新集成（@electron-forge/publisher-* vs electron-updater）

### 通过标准

- `forge.config.js` 含 `packagerConfig` 和 `makers` 数组
- 三个差异维度都能用一句话准确概括