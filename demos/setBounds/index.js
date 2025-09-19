const { ipcMain, app, BrowserWindow, BrowserView ,Menu } = require('electron')
const path = require('path')
const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
]



app.whenReady().then(() => {
  // Screenshots.initSingleton(app)
  // 
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)


  const mainWin = new BrowserWindow({
    show: true,
  })
  mainWin.removeMenu()
  mainWin.center()
  mainWin.setBounds({
    x: 100,
    y:100,
    width: 400,
    height: 400,
  })

  const size = mainWin.getSize()


  const tabView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, './preload.js')
    }
  })
  // tabView.setBackgroundColor('black')
  tabView.setBounds({
    x: 0,
    y: -size[1]+30+100,
    width: size[0],
    height: 100
  })
  mainWin.addBrowserView(tabView)
  tabView.webContents.openDevTools();
  tabView.webContents.loadFile(path.resolve(__dirname, './demo.html')).then(() => {
    ipcMain.on('SHOW_MENU', (event,data) => {
      menu.popup()
    })
  })

  const dashView = new BrowserView()
  dashView.setBounds({
    x: 0,
    y: -size[1]+30,
    width: size[0],
    height: 100
  })
  dashView.setBackgroundColor('red');
  dashView.webContents.openDevTools();

  mainWin.addBrowserView(dashView)
  mainWin.on('will-resize', (event, newBounds) => {
    mainWin.getBrowserViews().forEach((view) => {
      view.setBounds({ height: 100, width: newBounds.width, x: 0, y: 100 })
    })
  })
  

  mainWin.loadURL('http://baidu.com')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
