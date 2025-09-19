// 1. 引入 globalShortcut 注册快捷键
const { app, globalShortcut } = require('electron')

// 在 app ready 时注入此事件
app.on('ready', () => {
  globalShortcut.register('CommandOrControl+Y', () => {
    console.log('haha', new Date())
  })
})