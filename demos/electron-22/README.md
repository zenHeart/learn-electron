# Electron 22.3.27 基本示例

这是一个使用 Electron 22.3.27 版本的最基本示例。

## 安装依赖

```bash
npm install
```

## 运行应用

```bash
npm start
```

## 项目结构

- `main.js` - 主进程文件，控制应用生命周期和创建浏览器窗口
- `preload.js` - 预加载脚本，在渲染进程中安全地暴露 Node.js API
- `index.html` - 应用的主页面
- `renderer.js` - 渲染进程脚本
- `package.json` - 项目配置和依赖


