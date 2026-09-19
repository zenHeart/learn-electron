# 构建命令速查

```bash
# 本地：仅出未压缩目录（开发调试用，最快）
pnpm dist:dir

# macOS：dmg + zip；需环境变量 APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID
pnpm dist:mac

# Windows：NSIS 安装器；需 WINDOWS_CERT_FILE / WINDOWS_CERT_PASSWORD
pnpm dist:win

# Linux：AppImage + deb
pnpm dist:linux

# 三平台（macOS 上 = mac+linux；Linux 上 = win+linux 不能）
pnpm dist

# 发布（产物推到 publish 段配置的源 + 元数据）
pnpm publish
```

环境变量矩阵：

| 变量 | 平台 | 用途 |
|---|---|---|
| `APPLE_ID` | mac | Apple ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | mac | App-specific 密码 |
| `APPLE_TEAM_ID` | mac | 团队 ID |
| `CSC_LINK` / `CSC_KEY_PASSWORD` | mac/win | 代码签名证书（P12 格式） |
| `WINDOWS_CERT_FILE` / `WINDOWS_CERT_PASSWORD` | win | Windows 代码签名证书 |
| `GH_TOKEN` | all | 发布到 GitHub Releases（可选） |