import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type API } from './shared/ipc-contract'

const ALLOWED_KEY_RE = /^(theme|locale|auto-launch)$/

contextBridge.exposeInMainWorld('api', {
  getConfig(key) {
    if (typeof key !== 'string' || !ALLOWED_KEY_RE.test(key)) {
      return Promise.reject(new Error('非法的配置键'))
    }
    return ipcRenderer.invoke(IPC.configGet, key)
  },

  setConfig(key, value) {
    if (typeof key !== 'string' || !ALLOWED_KEY_RE.test(key)) {
      return Promise.reject(new Error('非法的配置键'))
    }
    return ipcRenderer.invoke(IPC.configSet, { key, value })
  },

  openFile(filters) {
    return ipcRenderer.invoke(IPC.dialogOpen, filters)
  },

  openExternal(url) {
    return ipcRenderer.invoke(IPC.shellOpenExternal, url)
  },

  onThemeChange(callback) {
    const listener = (_e: unknown, theme: string) => callback(theme)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  }
} satisfies API)