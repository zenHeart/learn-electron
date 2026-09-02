import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Learn Electron',
  description: 'Electron 实战学习站：理解核心逻辑、掌握实战经验、完成工程交付',
  lang: 'zh-CN',
  base: '/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0092b8' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Learn Electron | Electron 实战学习站' }],
    ['meta', { property: 'og:site_name', content: 'Learn Electron' }],
    ['meta', { property: 'og:image', content: 'https://electron.zenheart.site/logo.svg' }],
    ['meta', { property: 'og:url', content: 'https://electron.zenheart.site/' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=JetBrains+Mono:wght@400;600&display=swap'
      }
    ]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '第一部分 · 背景', link: '/part1-background/01-what-is-electron', activeMatch: '/part1-background/' },
      { text: '第二部分 · 核心', link: '/part2-core/06-first-app', activeMatch: '/part2-core/' },
      { text: '第三部分 · 工程', link: '/part3-engineering/15-scaffold', activeMatch: '/part3-engineering/' },
      { text: '第四部分 · 进阶', link: '/part4-advanced/24-native-node', activeMatch: '/part4-advanced/' },
      { text: '第五部分 · 实战', link: '/part5-projects/29-project-screenshot-recorder', activeMatch: '/part5-projects/' },
      { text: '案例库', link: '/cases/01-zoom-white-screen', activeMatch: '/cases/' },
      { text: 'Hub', items: [
        { text: 'Examples 跟学用例', link: '/examples/' },
        { text: '应用 Hub · 谁在用 Electron', link: '/hub/apps' },
        { text: '资料 Hub · 权威与三方资料', link: '/hub/resources' },
        { text: '学习路线图', link: '/appendix/roadmap' }
      ] },
      { text: '官方文档', link: 'https://www.electronjs.org/docs/latest' }
    ],

    sidebar: {
      '/part1-background/': [
        {
          text: '第一部分 · 技术背景与认知体系',
          collapsed: false,
          items: [
            { text: '01 · Electron 是什么', link: '/part1-background/01-what-is-electron' },
            { text: '02 · 发展历史：从 Atom Shell 到今天', link: '/part1-background/02-history' },
            { text: '03 · 技术架构剖析', link: '/part1-background/03-architecture' },
            { text: '04 · 进程模型（核心）', link: '/part1-background/04-process-model' },
            { text: '05 · 应用生命周期', link: '/part1-background/05-lifecycle' }
          ]
        }
      ],
      '/part2-core/': [
        {
          text: '第二部分 · 核心知识体系',
          collapsed: false,
          items: [
            { text: '06 · 新人第一课：第一个应用', link: '/part2-core/06-first-app' },
            { text: '07 · 窗口体系', link: '/part2-core/07-windows' },
            { text: '08 · 截屏与屏幕捕获', link: '/part2-core/08-screenshot' },
            { text: '09 · IPC 通信', link: '/part2-core/09-ipc' },
            { text: '10 · 安全模型', link: '/part2-core/10-security' },
            { text: '11 · 系统能力', link: '/part2-core/11-system' },
            { text: '12 · 存储架构', link: '/part2-core/12-storage' },
            { text: '13 · 配置系统', link: '/part2-core/13-config' },
            { text: '14 · 嵌入 Web 内容', link: '/part2-core/14-webview' }
          ]
        }
      ],
      '/part3-engineering/': [
        {
          text: '第三部分 · 工程体系（完整生命周期）',
          collapsed: false,
          items: [
            { text: '15 · 工程脚手架', link: '/part3-engineering/15-scaffold' },
            { text: '16 · 调试体系', link: '/part3-engineering/16-debugging' },
            { text: '17 · 测试实践', link: '/part3-engineering/17-testing' },
            { text: '18 · 性能优化', link: '/part3-engineering/18-performance' },
            { text: '19 · 打包与分发', link: '/part3-engineering/19-packaging' },
            { text: '20 · 签名与公证', link: '/part3-engineering/20-signing' },
            { text: '21 · 自动更新与热修复', link: '/part3-engineering/21-releases-updates' },
            { text: '22 · CI/CD', link: '/part3-engineering/22-cicd' },
            { text: '23 · 监控与可观测性', link: '/part3-engineering/23-observability' }
          ]
        }
      ],
      '/part4-advanced/': [
        {
          text: '第四部分 · 关键组合技术',
          collapsed: false,
          items: [
            { text: '24 · .node 扩展开发', link: '/part4-advanced/24-native-node' },
            { text: '25 · 原生 SDK 集成架构', link: '/part4-advanced/25-sdk-integration' },
            { text: '26 · 音视频与 RTC', link: '/part4-advanced/26-av-rtc' },
            { text: '27 · Electron 定制', link: '/part4-advanced/27-customize' },
            { text: '28 · 插件系统设计', link: '/part4-advanced/28-plugin-system' }
          ]
        }
      ],
      '/part5-projects/': [
        {
          text: '第五部分 · 实战项目',
          collapsed: false,
          items: [
            { text: '29 · 项目：截屏录屏工具', link: '/part5-projects/29-project-screenshot-recorder' },
            { text: '30 · 项目：多窗口应用', link: '/part5-projects/30-project-multiwindow' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples 跟学用例',
          collapsed: false,
          items: [
            { text: '用例地图', link: '/examples/' },
            { text: '01 · 最小窗口', link: '/examples/01-hello/' },
            { text: '02 · 生命周期观察', link: '/examples/02-lifecycle/' },
            { text: '03 · preload 与第一次 IPC', link: '/examples/03-preload-ipc/' },
            { text: '04 · 右键菜单', link: '/examples/04-context-menu/' },
            { text: '05 · 记住窗口位置', link: '/examples/05-window-state/' },
            { text: '06 · 托盘常驻', link: '/examples/06-tray/' },
            { text: '07 · 系统通知', link: '/examples/07-notification/' },
            { text: '08 · 用户数据读写', link: '/examples/08-file-io/' },
            { text: '09 · 给自己窗口截图', link: '/examples/09-capture-page/' },
            { text: '10 · Deep Link 协议', link: '/examples/10-open-url/' },
            { text: '11 · 单实例锁', link: '/examples/11-single-instance/' },
            { text: '12 · 主进程网络请求', link: '/examples/12-net/' }
          ]
        }
      ],
      '/cases/': [
        {
          text: '案例库 · 踩坑实录',
          collapsed: false,
          items: [
            { text: '01 · 缩放持久化白屏', link: '/cases/01-zoom-white-screen' },
            { text: '02 · GPU 崩溃五步分析法', link: '/cases/02-gpu-crash' },
            { text: '03 · setPosition 失效', link: '/cases/03-setposition' },
            { text: '04 · 多窗口关闭崩溃与升级决策', link: '/cases/04-multi-window-crash' },
            { text: '05 · 坐标系偏移', link: '/cases/05-browserview-coords' },
            { text: '06 · Apple Silicon 崩溃', link: '/cases/06-apple-silicon' },
            { text: '07 · 命令行开关不生效', link: '/cases/07-flag-not-working' }
          ]
        }
      ],
      '/hub/': [
        {
          text: 'Hub',
          collapsed: false,
          items: [
            { text: '应用 Hub · 谁在用 Electron', link: '/hub/apps' },
            { text: '资料 Hub · 权威与三方资料', link: '/hub/resources' }
          ]
        }
      ],
      '/appendix/': [
        {
          text: '附录',
          collapsed: false,
          items: [
            { text: '学习路线图', link: '/appendix/roadmap' },
            { text: '命令行与环境变量速查', link: '/appendix/cli-reference' },
            { text: '版本策略与升级清单', link: '/appendix/versioning' },
            { text: '术语表', link: '/appendix/glossary' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zenheart/learn-electron' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2020-present zenheart'
    },

    editLink: {
      pattern: 'https://github.com/zenheart/learn-electron/edit/master/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' }
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部'
  },

  lastUpdated: true,

  markdown: {
    lineNumbers: true,
    config(md) {
      // ::: exp 实战经验容器
      md.use(container, 'exp', {
        render(tokens, idx) {
          const token = tokens[idx]
          if (token.nesting === 1) {
            return `<div class="custom-block exp"><p class="custom-block-title">实战经验</p>\n`
          }
          return `</div>\n`
        }
      })
      // ::: pitfall 坑位警报容器
      md.use(container, 'pitfall', {
        render(tokens, idx) {
          const token = tokens[idx]
          if (token.nesting === 1) {
            return `<div class="custom-block pitfall"><p class="custom-block-title">坑位警报</p>\n`
          }
          return `</div>\n`
        }
      })
    }
  }
})
