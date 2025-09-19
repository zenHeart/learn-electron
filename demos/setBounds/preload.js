const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  showMenu: options => ipcRenderer.send('SHOW_MENU', options),
})
