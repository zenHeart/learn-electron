# 案例 6：Apple Silicon 上启动即崩——Rosetta 2 依赖问题

## 现象

应用在 Intel Mac 正常，**M1/M2（Apple Silicon）Mac 上启动直接崩溃**，或表现异常（性能极差、渲染错乱）。崩溃栈可能指向 V8 或原生模块。

## 诊断

```bash
# 检查当前架构
file node_modules/electron/dist/Electron.app/Contents/MacOS/Electron
# 输出含 x86_64 → 你在跑 Intel 版

# 原生模块架构
file node_modules/better-sqlite3/build/Release/better_sqlite3.node
```

两类根因：

1. **Electron 本体装错架构**：锁文件/缓存导致 arm64 机器装了 x64 版（或反之），靠 Rosetta 2 转译运行——Electron 官方明确不支持把 Rosetta 作为常规运行方式，崩在转译边界；
2. **原生模块架构不匹配**：Electron 是 arm64 但 `.node` 编译成 x64（或双架构混装），加载即崩。

## 修复

```bash
# 重装正确架构的依赖
rm -rf node_modules
npm install --arch=arm64            # 或让 Electron 自动匹配（删掉锁死 arch 的配置）

# 原生模块重编（对齐当前 Electron + 当前 CPU 架构）
npx @electron/rebuild -f -a arm64
```

打包侧：macOS 产物明确选择 `arm64` / `x64` / `universal`（双架构合一，体积翻倍）。分发时用 universal 包最省心，CI 用两个 target 分别构建则更快。

## 预防

- CI 增加 Apple Silicon runner 的冒烟（启动 + 截图），x64 runner 上测不出这类问题。
- 锁文件提交前确认没有硬编码 `--arch=x64`。
- 关联知识：[原生模块 ABI](/guide/10-native)——架构（arm64/x64）和 ABI（Electron 大版本）是两个独立对齐维度，缺一即崩。
