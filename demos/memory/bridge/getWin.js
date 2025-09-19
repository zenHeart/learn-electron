

const { ipcRenderer } = require('electron')

const invokeCurrentWindowFn = (fnName, ...args) =>
  ipcRenderer.invoke('invoke-current-win-function', fnName, ...args)

  const getCurrentWindowData = dataName => ipcRenderer.invoke('get-current-win-data', dataName)

exports.invokeCurrentWindowFn = invokeCurrentWindowFn

exports.getCurrentWindowData = getCurrentWindowData
exports.getCurrentWindow = () => {
  const curWin = {
    on: (eventName, cb) => {
      const callbackId = `${Date.now()}-${Math.random()}`
      // 将回调函数存储在全局对象中
      global[callbackId] = cb
      ipcRenderer.on(callbackId, (event, ...args) => {
        // 调用回调函数
        global[callbackId](...args)
      })
      // 发送IPC事件
      ipcRenderer.send('add-cur-win-listener', eventName, callbackId)
      return () => {
        ipcRenderer.off(callbackId, cb)
        global[callbackId] = undefined
      }
    },
    setMaximumSize: (width, height) => {
      invokeCurrentWindowFn('setMaximumSize', width, height)
    },
    setMinimumSize: (width, height) => {
      invokeCurrentWindowFn('setMinimumSize', width, height)
    },
    setMaximizable:flag=>{
      invokeCurrentWindowFn('setMaximizable',flag)
    },
    maximize: () => {
      invokeCurrentWindowFn('maximize')
    },
    unmaximize: () => {
      invokeCurrentWindowFn('unmaximize')
    },
    minimize: () => {
      invokeCurrentWindowFn('minimize')
    },
    setBounds: option => {
      invokeCurrentWindowFn('setBounds', option)
    },
    focus: () => {
      invokeCurrentWindowFn('focus')
    },
    show: () => {
      invokeCurrentWindowFn('show')
    },
    hide: () => {
      invokeCurrentWindowFn('hide')
    },
    restore: () => {
      invokeCurrentWindowFn('restore')
    },
    showInactive: () => {
      invokeCurrentWindowFn('showInactive')
    },
    isVisible: () => {
      return invokeCurrentWindowFn('isVisible')
    },
    isMinimized: () => {
      return invokeCurrentWindowFn('isMinimized')
    },
    isMaximized: () => {
      return invokeCurrentWindowFn('isMaximized')
    },
    isFocused:()=>{
      return invokeCurrentWindowFn('isFocused')
    },
    setBackgroundColor:color=>{
      invokeCurrentWindowFn('setBackgroundColor',color)
    },
    setFullScreenable:flag=>{
      invokeCurrentWindowFn('setFullScreenable',flag)
    },
    setFullScreen:flag=>{
      invokeCurrentWindowFn('setFullScreen',flag)
    },
    invokeCurrentWindowFn,
    getCurrentWindowData,
  }


  return curWin
}

