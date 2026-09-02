# Learn Electron

Electron 实战学习站：理解核心逻辑、掌握实战经验、完成工程交付。

线上地址：[electron.zenheart.site](https://electron.zenheart.site)（部署中）

## 站点结构

```text
docs/
├── guide/                    # 五篇式知识地图（金字塔结构）
│   ├── 01~05 认知篇          # 是什么/进程模型/生命周期/安全/IPC
│   ├── 06~10 实战篇          # 窗口/系统能力/存储/Web嵌入/原生扩展
│   ├── 11~14 交付篇          # 打包/签名/更新/CI
│   ├── 15~18 保障篇          # 调试/性能/测试/监控
│   └── cases/                # 七个真实踩坑案例（现象→诊断→根因→修复→预防）
└── appendix/                 # 路线图/命令行速查/版本策略/术语表/资源索引
```

## 本地开发

```bash
pnpm install
pnpm docs:dev        # http://localhost:5173
pnpm docs:build      # 产物在 docs/.vitepress/dist
```

## 内容来源与原则

- **不拷贝官方文档**：官方讲"是什么"，本站讲"为什么"与"生产上踩过什么坑"；每篇附官方 canonical 链接。
- **实战经验**：全部来自真实桌面客户端（Windows/macOS 多窗口、原生 SDK、百万级用户量）的生产实践，已做通用化改写，不含任何公司/产品内部信息。
- **金字塔写作**：每篇 = 一句话本质 → 心智模型 → 机理与最小示例 → 实战要点（铜色块）→ 坑位警报（橙色块）→ 延伸阅读。

## demos/

早期学习时的最小示例（quick-start、screenshot、shortcut、memory、setBounds、electron-22 测试骨架），与文档站相互独立。

## License

MIT
