// 主进程：唯一允许 require 系统模块的地方
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')

// 配置键白名单——桥的「动词」之外的「名词」也必须登记
const ALLOWED_CONFIG_KEYS = new Set(['theme', 'locale', 'auto-launch'])

const createWindow = () => {
  const win = new BrowserWindow({
    width: 720,
    height: 520,
    title: '安全基线示例'
    // 注意：webPreferences 里一个安全开关都没写
    // ——靠 Electron 30+ 的默认值（sandbox + contextIsolation + nodeIntegration:false）
    // webPreferences: {
    //   preload: path.join(__dirname, 'preload.js')
    // }
  })
  win.webPreferences ??= {}
  win.webPreferences.preload = path.join(__dirname, 'preload.js')
  win.loadFile('index.html')
}

// 通道：读配置 —— 主进程侧做第二次校验
ipcMain.handle('config:get', async (_event, key) => {
  if (!ALLOWED_CONFIG_KEYS.has(key)) {
    throw new Error(`未注册的配置键：${key}`)
  }
  return { key, value: process.env[`APP_${key.toUpperCase()}`] ?? null }
})

// 通道：选文件 —— 系统能力的标准封装
ipcMain.handle('dialog:openFile', async (_event, filters) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters ?? [{ name: '所有文件', extensions: ['*'] }]
  })
  return canceled ? null : filePaths[0]
})

// 通道：用系统默认应用打开外部链接 —— 防止页面拿 shell 任意执行
ipcMain.handle('shell:openExternal', async (_event, url) => {
  if (typeof url !== 'string' || !/^https:\/\//.test(url)) {
    throw new Error('只允许打开 https 链接')
  }
  await shell.openExternal(url)
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })