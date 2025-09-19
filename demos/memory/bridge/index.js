const path = require('path')
const os = require('os')
const { clipboard, nativeImage, ipcRenderer, shell } = require('electron')
const { registDb } = require('./db')
const { winFlash } = require('./notify')
const { getCurrentWindow } = require('./getWin')
const {
  getProcessMemoryInfo,
  getProcessCPUUsage,
  getWindowCount,
  getDeviceId,
} = require('./getProcessCpuMemo')
const ui = require('./ui')
const { version } = require('../package.json')

const injectJsPath = path.join(__dirname)
window.csBridge = {
  getCurrentWindow,
  winFlash,
  ipcRenderer,
  getRemote: () => require('@electron/remote'),
  ...ui,
  getProcessMemoryInfo,
  getProcessCPUUsage,
  performance:{
    getWindowCount,
    getDeviceId,
  },
  appInfo: {
    injectJsPath,
    appVersion: version,
    osVersion:os.version(),
    platform:process.platform,
    electronVersion:process.versions.electron,
    nodeVersion:process.versions.node,
  },
  supportNewAcct: true,
  supportNewUI:true,
  sitEnvDb: {
    updateSitUrl(config) {
      ipcRenderer.send('store:updateEndpoint', config)
    },
  },
  clientDb: {
    registDb,
  },
  clipboard,
  nativeImage,
  shell,
}
