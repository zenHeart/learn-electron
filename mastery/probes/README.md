# Mastery Probes · 学习掌握度探针

> 每个 capability 一个 Explain + Perform + Debug + Transfer 任务——掌握必须经过四维证据才能从 `learning` 进入 `mastered`。
>
> 评判标准：Explain 不查文档口述因果与边界；Perform 在新起点无提示完成真实任务；Debug 定位陌生故障并给最小修复；Transfer 把同一机制套到不同输入。

## 探针模板

每个 capability 的四件套结构：

```text
{capa-id}.md
├── 1) Explain    闭卷回答 3 道因果 / 不变量 / 边界题
├── 2) Perform    新起点无提示完成一个最小真实任务
├── 3) Debug      给一段陌生故障代码（现象 + 输入），定位根因 + 最小修复
└── 4) Transfer   把同一机制换约束 / 换平台 / 换工具再实现一遍
```

## 探针清单（按 capability）

| ID | 关联章节 | 状态 |
|---|---|---|
| [electron-process-model](./electron-process-model.md) | [04 进程模型](/part1-background/04-process-model) | 草案 |
| [electron-ipc](./electron-ipc.md) | [09 IPC](/part2-core/09-ipc) | 草案 |
| [electron-security-baseline](./electron-security-baseline.md) | [10 安全模型](/part2-core/10-security) | 草案 |
| [electron-window-lifecycle](./electron-window-lifecycle.md) | [07 窗口体系](/part2-core/07-windows) | 草案 |
| [electron-packaging-builder](./electron-packaging-builder.md) | [19 打包](/part3-engineering/19-packaging) | 草案 |
| [electron-performance-memory](./electron-performance-memory.md) | [18 性能](/part3-engineering/18-performance) | 草案 |
| [electron-testing](./electron-testing.md) | [17 测试](/part3-engineering/17-testing) | 草案 |

## 评分口径

| 维度 | 通过 | 有条件 | 不通过 |
|---|---|---|---|
| Explain | 答对全部 3 题且不查文档 | 答对 2 题 | ≤ 1 题 |
| Perform | 一次成功，无提示 | ≤ 2 次关键提示 | 需要完整脚手架 |
| Debug | 根因精确到文件:行号 + 修复有效 | 根因正确，修复不彻底 | 根因错误 |
| Transfer | 一次成功 | ≤ 2 次提示 | 移植失败 |

四维全通过 → `mastered`；任一维不通过则停留 `learning` 并把不通过的维度加入下次复测。