const {ipcRenderer} = require('electron')
const getCpuMemInfo = require('./getCpuMemInfo')

async function getProcessMemoryInfo() {
  const cpuMemInfo = await getCpuMemInfo()
  const memoryInfo = await process.getProcessMemoryInfo()

  const totalMemG = cpuMemInfo.totalMemG * 1024
  // 当前进程占用内存量，mac下策略不同，只能取到压缩后的内存
  const memUsage = (memoryInfo.residentSet || memoryInfo.private || 0) / 1024 // eslint-disable-line
  // 进程占据总内存的百分比
  const memUsagePercent = (100 - ((totalMemG - memUsage) / totalMemG * 100)).toFixed(2) // eslint-disable-line

  return {
    processMemUsage: memUsage,
    processMemUsagePercent: memUsagePercent,
  }
}

function getProcessCPUUsage() {
  return (process.getCPUUsage().percentCPUUsage).toFixed(2)
}

function getWindowCount(){
  return ipcRenderer.invoke('bridge:get-window-count')
}
function getDeviceId(){
  return ipcRenderer.invoke('bridge:get-device-id')
}
module.exports = {
  getProcessMemoryInfo,
  getProcessCPUUsage,
  getWindowCount,
  getDeviceId,
}
