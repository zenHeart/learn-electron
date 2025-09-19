// @ts-ignore
/* eslint-disable */
const { app, BrowserWindow } = require('electron')
const path = require('path')
require('./metrics/browser')

function createWindow(conf = {}) {
  const options = {
    show: true,
    center: true,
    fullscreen:false,
    maximizable:false,
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, './bridge/index.js'),
      nodeIntegration: true,
      webSecurity: false,
      webviewTag: true,
      enableRemoteModule: true,
      contextIsolation:false,
      zoomFactor:1,
    },
  }
  const mainWin = new BrowserWindow(options)
  mainWin.removeMenu()
  mainWin.loadURL('http://baidu.com')
  if(conf.title) {
    mainWin.setTitle(conf.title)
  }
}

app.whenReady().then(() => {
  createWindow({
    title: 'window1'
  })
  createWindow({
      title: 'window2'
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
