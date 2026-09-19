// Forge 等价配置（对照参考）
// 安装：pnpm add -D @electron-forge/cli @electron-forge/maker-{squirrel,nsis,dmg,zip,deb}
// 运行：pnpm electron-forge make
module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'markdown-notebook'
  },
  makers: [
    { name: '@electron-forge/maker-squirrel', config: { name: 'markdown_notebook' } },
    { name: '@electron-forge/maker-nsis',     config: { oneClick: false } },
    { name: '@electron-forge/maker-dmg',      config: {} },
    { name: '@electron-forge/maker-zip',      config: {} },
    { name: '@electron-forge/maker-deb',      config: { options: { maintainer: 'you@example.com' } } }
  ],
  publishers: [
    { name: '@electron-forge/publisher-github', config: { repository: { owner: 'example', name: 'markdown-notebook' } } }
  ]
}