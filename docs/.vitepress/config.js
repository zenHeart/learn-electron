import { defineConfig } from 'vitepress'

// Auto-generate navigation from docs folder structure
function generateSidebar() {
  return {
    '/': [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/01.introduction' },
          { text: 'APIs', link: '/02.apis' }
        ]
      },
      {
        text: 'Engineering',
        collapsed: false,
        items: [
          { text: 'Testing', link: '/03.engineering/05.test' },
          { text: 'Debug', link: '/03.engineering/debug' },
          { text: 'Extensions', link: '/03.engineering/extension' },
          { text: 'Common Issues', link: '/03.engineering/hole' },
          { text: 'Tools', link: '/03.engineering/tools' },
          { text: "metrics", link: "/03.engineering/metrics" }
        ]
      },
      {
        text: 'Performance',
        collapsed: false,
        items: [
          { text: 'Memory Management', link: '/04.performance/memory' },
          { text: 'Tracing', link: '/04.performance/trace' }
        ]
      },
      {
        text: "drafts",
        items: [
          { text: "infrastructure", link: "/drafts/infrastructure" },
        ]
      }
    ]
  }
}

export default defineConfig({
  title: 'Learn Electron',
  description: 'Comprehensive Electron.js learning documentation',
  base: '/electron/',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/01.introduction' },
    ],
    
    sidebar: generateSidebar(),
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/learn-electron' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Learn Electron'
    },
    
    editLink: {
      pattern: 'https://github.com/your-username/learn-electron/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    
    search: {
      provider: 'local'
    }
  },
  
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // Add markdown plugins if needed
    }
  },
  
  head: [
    ['link', { rel: 'icon', href: '/electron/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#47cacc' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Learn Electron | Comprehensive Electron.js Documentation' }],
    ['meta', { property: 'og:site_name', content: 'Learn Electron' }],
    ['meta', { property: 'og:image', content: 'https://blog.zenheart.site/electron/logo.svg' }],
    ['meta', { property: 'og:url', content: 'https://blog.zenheart.site/electron/' }]
  ]
})