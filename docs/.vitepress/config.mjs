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
      { text: '认知', link: '/guide/01-what-is-electron', activeMatch: '/guide/0[1-5]' },
      { text: '实战', link: '/guide/06-windows', activeMatch: '/guide/(0[6-9]|10)' },
      { text: '交付', link: '/guide/11-packaging', activeMatch: '/guide/1[1-4]' },
      { text: '保障', link: '/guide/15-debugging', activeMatch: '/guide/1[5-8]' },
      { text: '案例库', link: '/guide/cases/01-zoom-white-screen', activeMatch: '/guide/cases/' },
      { text: '附录', link: '/appendix/roadmap', activeMatch: '/appendix/' },
      { text: '官方文档', link: 'https://www.electronjs.org/docs/latest' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '认知篇 · 它是什么',
          collapsed: false,
          items: [
            { text: 'Electron 是什么', link: '/guide/01-what-is-electron' },
            { text: '进程模型（核心）', link: '/guide/02-process-model' },
            { text: '应用生命周期', link: '/guide/03-lifecycle' },
            { text: '安全模型', link: '/guide/04-security' },
            { text: 'IPC 通信', link: '/guide/05-ipc' }
          ]
        },
        {
          text: '实战篇 · 怎么开发',
          collapsed: false,
          items: [
            { text: '窗口管理', link: '/guide/06-windows' },
            { text: '系统能力', link: '/guide/07-system' },
            { text: '数据与存储', link: '/guide/08-storage' },
            { text: '嵌入 Web 内容', link: '/guide/09-webview' },
            { text: '原生能力扩展', link: '/guide/10-native' }
          ]
        },
        {
          text: '交付篇 · 到用户手里',
          collapsed: false,
          items: [
            { text: '打包与分发', link: '/guide/11-packaging' },
            { text: '签名与公证', link: '/guide/12-signing' },
            { text: '自动更新与热修复', link: '/guide/13-updates' },
            { text: 'CI/CD 与无头测试', link: '/guide/14-cicd' }
          ]
        },
        {
          text: '保障篇 · 调试与守护',
          collapsed: false,
          items: [
            { text: '调试体系', link: '/guide/15-debugging' },
            { text: '性能优化', link: '/guide/16-performance' },
            { text: '测试实践', link: '/guide/17-testing' },
            { text: '监控与可观测性', link: '/guide/18-observability' }
          ]
        },
        {
          text: '案例库 · 踩坑实录',
          collapsed: false,
          items: [
            { text: '缩放持久化白屏', link: '/guide/cases/01-zoom-white-screen' },
            { text: 'GPU 崩溃五步分析法', link: '/guide/cases/02-gpu-crash' },
            { text: 'setPosition 失效', link: '/guide/cases/03-setposition' },
            { text: '多窗口关闭崩溃与升级决策', link: '/guide/cases/04-multi-window-crash' },
            { text: '坐标系偏移', link: '/guide/cases/05-browserview-coords' },
            { text: 'Apple Silicon 崩溃', link: '/guide/cases/06-apple-silicon' },
            { text: '命令行开关不生效', link: '/guide/cases/07-flag-not-working' }
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
            { text: '术语表', link: '/appendix/glossary' },
            { text: '官方资源索引', link: '/appendix/resources' }
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
