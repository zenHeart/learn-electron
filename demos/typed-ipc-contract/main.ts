import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'node:path'
import type { IpcHandlerMap } from './shared/ipc-contract'

const ALLOWED_KEYS = new Set(['theme', 'locale', 'auto-launch'])

const createWindow = () => {
  const win = new BrowserWindow({
    width: 720,
    height: 520,
    webPreferences: { preload: join(__dirname, 'preload.js') }
  })
  win.loadFile('index.html')
}

function registerHandler<K extends keyof IpcHandlerMap>(
  channel: K,
  handler: IpcHandlerMap[K]
) {
  ipcMain.handle(channel, handler as any)
}

registerHandler('config:get', async (_event, key) => {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`未注册的 key: ${key}`)
  return { key, value: process.env[`APP_${key.toUpperCase()}`] ?? null }
})

registerHandler('config:set', async (_event, { key, value }) => {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`未注册的 key: ${key}`)
  console.log(`set ${key} = ${value}`)
})

registerHandler('dialog:openFile', async (_event, filters) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters ?? [{ name: '所有文件', extensions: ['*'] }]
  })
  return canceled ? null : filePaths[0]
})

registerHandler('shell:openExternal', async (_event, url) => {
  if (!/^https:\/\//.test(url)) throw new Error('只允许 https')
  await shell.openExternal(url)
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })