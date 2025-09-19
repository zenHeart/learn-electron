
const { app, BrowserWindow, ipcMain,session } = require('electron')
const v8 = require('v8')
const { humanMemInfo, IPCChannel, SIZE_UNIT, isMacOs, CONFIG } = require('./common')
const renderMemoInfo = {}


/**
 * 由于当前应用使用的 electron 版本为 22.3.27  node 为 16.17.1 暂时不支持这个 api
 * 后续可利用此 api 作为内存紧张的判断阈值
 * */
// function constrainedMemory() {
//   return  process.constrainedMemory()
// }

/**
 * 
 * 获取运行内存信息
 * @param {Object} options detailModel 是否需要详细数据，默认不需要，在 oom 时获取详细信息
 * 
 */
async function getRunningMemory(options = {
  detailModel: false
}) {
  const processMemInfo = await process.getProcessMemoryInfo()
  const allProcessInfo = app.getAppMetrics();
  let renderProcessNum = 0;
  const processesDetails = allProcessInfo.map(processInfo => {
    if(processInfo.type === 'Tab') {
      renderProcessNum++
    }
    if(renderMemoInfo[processInfo.pid]) {
      return Object.assign({}, processInfo, renderMemoInfo[processInfo.pid])
    }
  
    return processInfo
  })

  let extraInfo = {
  }
  if(options.detailModel) {
    extraInfo = {
      systemInfo: process.getSystemMemoryInfo(),
      resourceUsage: process.resourceUsage(),
      memoryUsage: process.memoryUsage(),
      heapStatistics: process.getHeapStatistics(),
      heapSpaceStatistics: v8.getHeapSpaceStatistics()
      // v8.getHeapSnapshot 用于获取内存快照，目前暂不考虑， 后续可存入用户目录
    }
  }

  return Object.assign({},processMemInfo, {
    renderProcessNum,
    processesDetails
  }, extraInfo)
}

function injectPreloadScript() {
  app.once('ready', () => {
    const path = require.resolve('./renderer.js');

    if (path) {
      for (const sesh of [session.defaultSession]) {
        // Fetch any existing preloads so we don't overwrite them
        const existing = sesh.getPreloads();
        sesh.setPreloads([path, ...existing]);
      }
    }
  });
}

function loopCollector() {
  let timer = setInterval(async ()=>{
    let res = await getRunningMemory()
    console.log('main loopCollector', res)
  }, CONFIG.mainLoopInterval)
  // 避免影响主进程退出
  timer.unref()

  ipcMain.on(IPCChannel.RENDER_MEMORY_INFO, (event, {pid, ...extraInfo}) =>{
    renderMemoInfo[pid] = extraInfo
    console.log(`render ${pid}`, extraInfo)
  })
}

async function firstCollector() {
  let res = await getRunningMemory({
    detailModel: true
  })
  console.log('main firstCollector', res)
}

async function oomCollector() {
  app.on('child-process-gone', async (e, details) => {
    if (details.reason === 'oom') {
      let res = await getRunningMemory({
        detailModel: true
      })
      console.log('main oom error', res)
    }
  })
  app.on('render-process-gone', async (e, details) => {
    if (details.reason === 'oom') {
      let res = await getRunningMemory({
        detailModel: true
      })
      console.log('main oom error', res)
    }
  })


}

function init() {
  injectPreloadScript()
  app.whenReady().then(() => {
    firstCollector()
    loopCollector()
  })
}

init()

