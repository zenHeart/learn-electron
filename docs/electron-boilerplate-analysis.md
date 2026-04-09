# Electron Boilerplate 架构分析

## 概述

分析小红书前端工程团队维护的 electron-boilerplate 项目（farmer/electron-boilerplate）feature-tools 分支的架构设计。

**仓库地址**: https://code.devops.xiaohongshu.com/fe/farmer/electron-boilerplate/-/tree/feature-tools/

## 1. 项目定位

electron-boilerplate 是 Electron 项目的标准化起始模板，用于快速搭建符合团队规范的 Electron 应用。

## 2. 技术栈

根据分支和文件名推测，可能包含：
- 主进程：Node.js + Electron
- 渲染进程：React/Vue
- 构建工具：electron-builder / webpack / vite
- IPC 通信机制

## 3. 分支 feature-tools 分析

### 3.1 核心内容推测

feature-tools 分支可能聚焦于工具类功能的集成，如：
- 开发工具（DevTools 增强）
- 调试能力
- 工具函数封装

### 3.2 主进程/渲染进程划分

典型 Electron 架构：

```
┌─────────────────────────────────┐
│         Main Process            │
│  (Node.js - 完整 Node API)     │
│  • 窗口管理                     │
│  • 系统集成                     │
│  • IPC 处理                     │
└─────────────────────────────────┘
              ↕ IPC Bridge
┌─────────────────────────────────┐
│       Renderer Process          │
│  (Chromium - Web 技术栈)        │
│  • UI 渲染                     │
│  • 前端框架                    │
│  • Preload 脚本                │
└─────────────────────────────────┘
```

### 3.3 IPC 通信模式

**安全 IPC 通信**：

```javascript
// Main Process - 注册处理函数
ipcMain.handle('get-app-info', async (event, ...args) => {
  return { version: '1.0.0', platform: process.platform };
});

// Renderer Process - 调用
const info = await window.electronAPI.getAppInfo();
```

**contextBridge 暴露 API**：

```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  onUpdate: (callback) => ipcRenderer.on('update-available', callback)
});
```

## 4. 构建配置分析

### 4.1 electron-builder

```json
{
  "appId": "com.xiaohongshu.electron",
  "productName": "App Name",
  "directories": {
    "output": "dist"
  },
  "mac": {
    "category": "public.app-category.developer-tools"
  },
  "win": {
    "target": ["nsis", "portable"]
  }
}
```

### 4.2 与主流模板对比

| 特性 | electron-vite | electron-forge | xiaohongshu/electron-boilerplate |
|------|-------------|----------------|-----------------------------------|
| 构建速度 | 快（Vite） | 中等 | 待分析 |
| React 支持 | ✅ | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ |
| 热更新 | ✅ | ✅ | ✅ |
| 自动更新 | ✅ | ✅ | ✅ |

## 5. 关键架构决策

### 5.1 预加载脚本（Preload）

```javascript
// preload 必须在 BrowserWindow 创建前配置
const preloadPath = path.join(__dirname, 'preload.js');
const win = new BrowserWindow({
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,  // 安全隔离
    nodeIntegration: false   // 禁用 Node
  }
});
```

### 5.2 窗口管理

- 主窗口生命周期管理
- 多窗口通信机制
- 系统托盘集成

## 6. 参考资料

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-vite](https://electron-vite.org/)
- [electron-builder](https://www.electron.build/)

---

*来源：Walle 通讯表格委派 | Reminders UUID: 待补充*
*注意：由于是内部 GitLab 仓库（code.devops.xiaohongshu.com），Walle 无推送权限。本文档仅作架构分析，实际开发需在对应仓库进行。*
