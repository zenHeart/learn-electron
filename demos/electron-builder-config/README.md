# electron-builder · 完整三平台打包配置示例

> 关联：[打包与分发](/part3-engineering/19-packaging) · [签名与公证](/part3-engineering/20-signing) · [自动更新](/part3-engineering/21-releases-updates) · 难度 ★★★★

一份覆盖 **macOS / Windows / Linux** 三平台的 electron-builder 配置，含 asar / asarUnpack / extraResources / 签名 / 公证 / 自动更新。把它复制到你的项目根，把 `appId`、`productName`、`icon` 换成你的值就能用。

## 文件清单

```text
electron-builder-config/
├── package.json             # 含 build 段（兼容老用户）/ devDep: electron-builder
├── electron-builder.yml     # 主配置
├── forge.config.js          # （对照）同样效果用 Forge 怎么写
├── README.md                # 本文件
└── docs/
    ├── build-cmds.md        # 关键命令清单
    └── ci-snippet.yml       # GitHub Actions 触发片段
```

## electron-builder.yml —— 一份配置覆盖三平台

```yaml
# ============================================================
# 应用身份
# ============================================================
appId: com.example.markdown-notebook      # 反向域名，更新与签名都以它为准
productName: Markdown Notebook           # 用户可见的安装名
copyright: Copyright © 2026 ${author}

# ============================================================
# 目录与产物
# ============================================================
directories:
  output: dist                 # 产物输出目录
  buildResources: build        # 图标 / entitlements 所在

# ============================================================
# 进入 asar 的内容（相对项目根）
# 规则：源代码进 asar；原生模块与外部可执行文件必须 unpack
# ============================================================
files:
  - package.json
  - main/**/*
  - preload/**/*
  - renderer/**/*
  - '!**/{__tests__,test,tests}/**'   # 排除测试代码
  - '!**/*.{md,markdown}'            # 文档不进包

asar: true
asarUnpack:
  - '**/*.node'               # 原生模块：加载时需要真实文件路径
  - '**/node_modules/sharp/**/*'  # 包含 prebuilt binaries 的包（按需）

# 不进 asar，落到 resources/ 目录
# 运行时用 process.resourcesPath + '/xxx' 访问
extraResources:
  - from: build/bin
    to: bin
    filter: ['**/*']
  - from: build/locales
    to: locales

# ============================================================
# 三平台产物
# ============================================================

# ---- Windows：NSIS 安装器 ----
win:
  target:
    - target: nsis
      arch: [x64, arm64]
  icon: build/icon.ico
  # signing 配置：从环境变量读证书
  # 留空时构建未签名包（开发用），发布前必须配
  certificateFile: ${env.WINDOWS_CERT_FILE}
  certificatePassword: ${env.WINDOWS_CERT_PASSWORD}
  signingHashAlgorithms: [sha256]

nsis:
  oneClick: false                  # 关闭一键安装
  perMachine: false                # 不强制装到 Program Files
  allowToChangeInstallationDirectory: true
  allowElevation: true
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: ${productName}
  artifactName: ${productName}-${version}-${arch}-setup.${ext}

# ---- macOS：dmg + zip ----
mac:
  target:
    - target: dmg
      arch: [x64, arm64]          # 通用二进制：一个包覆盖 Intel + Apple Silicon
    - target: zip                  # 自动更新用 zip
  category: public.app-category.productivity
  icon: build/icon.icns
  hardenedRuntime: true             # 公证的前置
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  # notarize 走环境变量；本地开发可临时设为 false
  notarize: true
  notarizeService: notarytool      # 用 notarytool（取代老 altool）

dmg:
  sign: true                       # dmg 自身也签名
  artifactName: ${productName}-${version}-${arch}.${ext}

# ---- Linux：AppImage + deb ----
linux:
  target:
    - target: AppImage
    - target: deb
  icon: build/icons
  category: Office
  maintainer: you@example.com
  vendor: example
  desktop:
    Name: ${productName}
    Comment: A minimal Markdown editor
    Categories: Office;TextEditor;

# ============================================================
# 自动更新（electron-updater）
# provider: generic = 自有静态服务器 / GitHub = GitHub Releases
# ============================================================
publish:
  - provider: generic
    url: https://releases.example.com/${os}/
    channel: latest
    # 用哪个文件作为「latest」元数据
    # macOS: latest-mac.yml   Windows: latest.yml   Linux: latest-linux.yml
  # 国内部署时可考虑：增加 GitHub provider 作为镜像
  # - provider: github
  #   owner: example
  #   repo: markdown-notebook
```

## package.json

```json
{
  "name": "markdown-notebook",
  "version": "1.0.0",
  "main": "main/index.js",
  "scripts": {
    "build": "vite build",
    "dist": "pnpm build && electron-builder",
    "dist:mac": "pnpm build && electron-builder --mac",
    "dist:win": "pnpm build && electron-builder --win",
    "dist:linux": "pnpm build && electron-builder --linux",
    "dist:dir": "pnpm build && electron-builder --dir",
    "publish": "pnpm build && electron-builder --publish always"
  },
  "devDependencies": {
    "electron": "^31.0.0",
    "electron-builder": "^24.13.3"
  },
  "build": {
    "//": "可在此处覆盖 yaml；推荐用独立 yaml 文件，保持 package.json 干净"
  }
}
```

## docs/build-cmds.md —— 关键命令

```bash
# 安装 builder（已经装过则跳过）
pnpm add -D electron-builder

# 本地仅出未压缩目录（开发调试用，最快）
pnpm dist:dir

# macOS：出 dmg + zip，自动启动公证流程
# 公证需要这些环境变量：
#   APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID
# macOS 公证硬性要求：签名 + hardenedRuntime + notarize + entitlements
pnpm dist:mac

# Windows：出 NSIS 安装器
# 签名需要：CSC_LINK / CSC_KEY_PASSWORD  或  WINDOWS_CERT_FILE / WINDOWS_CERT_PASSWORD
pnpm dist:win

# Linux：出 AppImage + deb
pnpm dist:linux

# 三平台一起（在 macOS / Linux 上跑可同时出 mac+linux 或 win+linux；windows 单独）
pnpm dist
```

## docs/ci-snippet.yml —— CI 触发片段

```yaml
# .github/workflows/release.yml —— 打 tag 时触发
name: release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-14, windows-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm dist
        env:
          # macOS
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          # Windows
          WINDOWS_CERT_FILE: ${{ secrets.WINDOWS_CERT_FILE }}
          WINDOWS_CERT_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
          # 公证/签名共用：token
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.os }}
          path: dist/
```

## forge.config.js —— 同样效果用 Forge 怎么写（对照参考）

```js
// 用 Forge 出三平台 maker（功能对比见正文第 19 章）
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
```

## 常见错误

| 错误 | 后果 | 正解 |
|---|---|---|
| `.node` 没加进 `asarUnpack` | 原生模块加载报 `NODE_MODULE_VERSION` 错 | 任何 `*.node` 都必须 unpack |
| 把私钥 / 证书 commit 进仓 | 安全事故 | 一律走环境变量或 `~/.config` 下的 OS keychain |
| macOS 没开 `hardenedRuntime` 就开 `notarize` | 公证失败：error code -5000 | hardenedRuntime 是公证的前置条件 |
| Windows 用 `signtool` 签了安装器，没签 NSIS 卸载器 | 卸载时被 SmartScreen 拦截 | 让 builder 全包签（cert + 卸载器 + 更新器 + 增量补丁） |
| 在 CI 上跑了 `pnpm dist:mac` 但没装 `xcode-select` | 「no developer directory」 | macOS runner 自带；Linux/Windows runner 不能产 macOS 产物 |
| 把 publish 写在 dev 用的 `dist:dir` 里 | 误把半成品发布 | dir 模式跳过 publish；publish 单独命令 |

## 验证清单

```text
□ pnpm dist:dir 跑通，产物目录可启动
□ macOS 产物双击能在干净机器打开（带签名+公证）
□ Windows 产物在干净机器装不被 SmartScreen 拦
□ Linux AppImage chmod +x 后能运行
□ latest.yml / latest-mac.yml 元数据文件生成
□ 把 dist/ 推到 releases.example.com 后，应用的 auto-updater 能检查到更新
```