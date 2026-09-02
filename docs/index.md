---
layout: home

hero:
  name: "Learn Electron"
  text: "从核心逻辑到生产实战"
  tagline: "理解进程模型，就理解了一切 API 与一切坑。一篇篇读下去，你会得到一张覆盖窗口、IPC、打包、签名、更新、调试、性能的完整地图。"
  actions:
    - theme: brand
      text: 从认知篇开始
      link: /guide/01-what-is-electron
    - theme: alt
      text: 直接看案例库
      link: /guide/cases/01-zoom-white-screen
    - theme: alt
      text: 学习路线图
      link: /appendix/roadmap
---

<script setup>
import { defineComponent, h } from 'vue'
import OrbitHero from './.vitepress/theme/components/OrbitHero.vue'

const groups = [
  {
    num: '01',
    name: '认知篇',
    desc: '它是什么、怎么工作的',
    items: [
      ['Electron 是什么', '/guide/01-what-is-electron', '三层本质与选型判断'],
      ['进程模型', '/guide/02-process-model', '全站最重要的一章'],
      ['应用生命周期', '/guide/03-lifecycle', '从 ready 到 quit 的事件流'],
      ['安全模型', '/guide/04-security', '三开关的真实含义'],
      ['IPC 通信', '/guide/05-ipc', '三种模式与安全封装']
    ]
  },
  {
    num: '02',
    name: '实战篇',
    desc: '怎么做出一个桌面应用',
    items: [
      ['窗口管理', '/guide/06-windows', '多窗口架构与坐标系坑'],
      ['系统能力', '/guide/07-system', '菜单/托盘/通知/协议'],
      ['数据与存储', '/guide/08-storage', '分层存储与 safeStorage'],
      ['嵌入 Web 内容', '/guide/09-webview', '三种嵌入方式选型'],
      ['原生能力扩展', '/guide/10-native', 'N-API 与 SDK 集成']
    ]
  },
  {
    num: '03',
    name: '交付篇',
    desc: '从代码到用户手里',
    items: [
      ['打包与分发', '/guide/11-packaging', 'builder vs forge'],
      ['签名与公证', '/guide/12-signing', '远程签名架构'],
      ['自动更新与热修复', '/guide/13-updates', '四层更新体系'],
      ['CI/CD', '/guide/14-cicd', '无头测试与流水线']
    ]
  },
  {
    num: '04',
    name: '保障篇',
    desc: '调试、性能与监控',
    items: [
      ['调试体系', '/guide/15-debugging', '分进程调试地图'],
      ['性能优化', '/guide/16-performance', '内存/启动/GPU'],
      ['测试实践', '/guide/17-testing', 'Playwright 实战'],
      ['监控与可观测性', '/guide/18-observability', '崩溃采集与指标']
    ]
  },
  {
    num: '05',
    name: '案例库',
    desc: '现象 → 诊断 → 根因 → 修复',
    items: [
      ['七个真实案例', '/guide/cases/01-zoom-white-screen', '白屏/GPU崩溃/坐标/升级']
    ]
  }
]

const SiteMap = defineComponent({
  setup() {
    return () =>
      h('div', { class: 'sitemap' },
        groups.map(g =>
          h('section', { class: 'sitemap-group' }, [
            h('div', { class: 'sitemap-head' }, [
              h('span', { class: 'sitemap-num', 'data-num': g.num }, g.num),
              h('div', { class: 'sitemap-title' }, [
                h('strong', null, g.name),
                h('small', null, g.desc)
              ])
            ]),
            h('ul', { class: 'sitemap-items' },
              g.items.map(([text, link, hint]) =>
                h('li', null,
                  h('a', { href: link }, [
                    h('span', { class: 'sitemap-item-text' }, text),
                    h('span', { class: 'sitemap-item-hint' }, hint)
                  ])
                )
              )
            )
          ])
        )
      )
  }
})
</script>

<OrbitHero />

<style scoped>
:deep(.VPHero .image-bg) {
  display: none;
}
</style>

::: info 这一站怎么读
每个知识域的回答都遵循同一个结构：**一句话本质 → 心智模型 → 机理与最小示例 → 实战要点**。官方文档讲"是什么"，这里补"为什么"和"生产上真踩过什么坑"。所有经验都来自真实桌面客户端的生产实践，已做通用化改写。
:::

## 站点地图

<SiteMap />

<style scoped>
.sitemap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 8px;
}

.sitemap-group {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 18px;
  background: var(--vp-c-bg);
}

.sitemap-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--vp-c-divider);
}

.sitemap-num {
  display: inline-grid;
  place-items: center;
  min-width: 2em;
  height: 2em;
  padding: 0 0.3em;
  background: var(--vp-c-text-1);
  color: var(--vp-c-brand-3);
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 14px;
}

.sitemap-title {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.sitemap-title strong {
  font-size: 15px;
  color: var(--vp-c-text-1);
}

.sitemap-title small {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.sitemap-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sitemap-items a {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: background 0.2s;
}

.sitemap-items a:hover {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-2);
}

.sitemap-item-hint {
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .sitemap-item-hint {
    display: none;
  }
}
</style>
