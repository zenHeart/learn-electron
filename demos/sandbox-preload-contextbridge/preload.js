// preload：唯一能同时看到 ipcRenderer 和 contextBridge 的世界
const { contextBridge, ipcRenderer } = require('electron')

// 通道名只在 preload 里出现一次：渲染进程看不到字符串常量
const CONFIG_KEY_RE = /^(theme|locale|auto-launch)$/

contextBridge.exposeInMainWorld('api', {
  // 1) 语义化窄接口：动词白名单
  getConfig(key) {
    // 2) 桥这一侧先做一次浅校验，把明显非法的挡在 IPC 之外
    if (typeof key !== 'string' || !CONFIG_KEY_RE.test(key)) {
      return Promise.reject(new Error('非法的配置键'))
    }
    return ipcRenderer.invoke('config:get', key)
  },

  openFile(filters) {
    return ipcRenderer.invoke('dialog:openFile', filters)
  },

  openExternal(url) {
    return ipcRenderer.invoke('shell:openExternal', url)
  },

  // 3) 事件订阅返回「取消订阅」函数 —— 不暴露频道名
  onThemeChange(callback) {
    const listener = (_event, theme) => callback(theme)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  }
})