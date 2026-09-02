---
layout: home

hero:
  name: "Learn Electron"
  text: "从新人到专家的完整书单"
  tagline: "一本按架构组织的实战书：第一部分建立技术背景与认知体系，第二部分按新人真实场景由浅入深讲透核心知识，第三部分覆盖开发到上线维护的完整工程生命周期，第四部分深入 .node 扩展、Electron 定制与插件系统，第五部分用截屏录屏工具与多窗口工作台两个完整项目收束全书。配 12 个跟学用例与案例库，经验全部来自真实桌面客户端生产沉淀。"
  actions:
    - theme: brand
      text: 从第一部分开始
      link: /part1-background/01-what-is-electron
    - theme: alt
      text: 跟学用例集
      link: /examples/
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
    name: '第一部分 · 技术背景与认知',
    desc: '它是什么、从哪来、怎么组装的',
    items: [
      ['Electron 是什么', '/part1-background/01-what-is-electron', '三层本质与选型'],
      ['发展历史', '/part1-background/02-history', 'Atom Shell 到今天'],
      ['技术架构剖析', '/part1-background/03-architecture', 'Chromium×Node 集成'],
      ['进程模型', '/part1-background/04-process-model', '全书最重要一章'],
      ['应用生命周期', '/part1-background/05-lifecycle', 'ready 到 quit']
    ]
  },
  {
    num: '02',
    name: '第二部分 · 核心知识体系',
    desc: '新人真实场景，由浅入深',
    items: [
      ['新人第一课', '/part2-core/06-first-app', '第一个应用'],
      ['窗口体系', '/part2-core/07-windows', '管理器/状态机/多账号'],
      ['截屏与屏幕捕获', '/part2-core/08-screenshot', '三路径与权限'],
      ['IPC 通信', '/part2-core/09-ipc', '生产封装工具箱'],
      ['安全模型', '/part2-core/10-security', '三开关与基线清单'],
      ['系统能力', '/part2-core/11-system', '菜单/托盘/深链'],
      ['存储架构', '/part2-core/12-storage', '分层/partition'],
      ['配置系统', '/part2-core/13-config', '四层/规则引擎'],
      ['嵌入 Web 内容', '/part2-core/14-webview', '三方式选型']
    ]
  },
  {
    num: '03',
    name: '第三部分 · 工程体系',
    desc: '开发→调试→测试→构建→签名→发布→观测',
    items: [
      ['工程脚手架', '/part3-engineering/15-scaffold', '目录/构建链/TS'],
      ['调试体系', '/part3-engineering/16-debugging', '分进程调试地图'],
      ['测试实践', '/part3-engineering/17-testing', 'Playwright'],
      ['性能优化', '/part3-engineering/18-performance', '内存/启动/GPU'],
      ['打包与分发', '/part3-engineering/19-packaging', 'builder vs forge'],
      ['签名与公证', '/part3-engineering/20-signing', '远程签名'],
      ['更新与热修复', '/part3-engineering/21-releases-updates', '四层体系'],
      ['CI/CD', '/part3-engineering/22-cicd', '无头测试'],
      ['监控可观测', '/part3-engineering/23-observability', '崩溃/指标']
    ]
  },
  {
    num: '04',
    name: '第四部分 · 关键组合技术',
    desc: '.node 扩展 · 定制 · 插件',
    items: [
      ['.node 扩展开发', '/part4-advanced/24-native-node', '从零写 addon'],
      ['原生 SDK 集成', '/part4-advanced/25-sdk-integration', '放置与同构注入'],
      ['音视频与 RTC', '/part4-advanced/26-av-rtc', '三渲染方案'],
      ['Electron 定制', '/part4-advanced/27-customize', 'fuses/开关/源码'],
      ['插件系统设计', '/part4-advanced/28-plugin-system', '四模式递进']
    ]
  },
  {
    num: '05',
    name: '第五部分 · 实战项目',
    desc: '全书知识合练',
    items: [
      ['截屏录屏工具', '/part5-projects/29-project-screenshot-recorder', '六轮迭代到发布'],
      ['多窗口工作台', '/part5-projects/30-project-multiwindow', '窗口协作与账号隔离']
    ]
  },
  {
    num: '06',
    name: 'Hub 与案例库',
    desc: '用例 · 应用 · 资料 · 踩坑',
    items: [
      ['Examples 跟学用例', '/examples/', '12 个递进用例'],
      ['应用 Hub', '/hub/apps', '谁在用 Electron'],
      ['资料 Hub', '/hub/resources', '权威与三方资料'],
      ['案例库', '/cases/01-zoom-white-screen', '七个真实坑']
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
