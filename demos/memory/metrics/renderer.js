/**
 * This preload script may be used with sandbox mode enabled which means regular require is not available.
 */
const { contextBridge, ipcRenderer, webFrame } = require('electron');
const v8 = require('v8');
const { IPCChannel, CONFIG } = require('./common');

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
 * @param {Object} options detailModel 是否需要详细模式，默认不需要，在 oom 时获取详细信息
 * 
 */
async function getRunningMemory(options= {
  detailModel: false
}) {
  const processMemInfo = await process.getProcessMemoryInfo()

  let extraInfo = {
  }

  if(options.detailModel) {
    extraInfo = {
      blinkMemoryInfo: process.getBlinkMemoryInfo(),
      memoryUsage: process.memoryUsage(),
      resourceUsage: process.resourceUsage(),
      heapStatistics: process.getHeapStatistics(),
      heapSpaceStatistics: v8.getHeapSpaceStatistics(),
      webFrameResourceUsage: webFrame.getResourceUsage(),
      performanceMemory: performance.memory,
    }
  }

  return Object.assign({},processMemInfo, extraInfo)
}

let loopCollectorTimer
function loopCollector() {
  loopCollectorTimer = setInterval(async ()=> {
    let res = await getRunningMemory()
    console.log('render loopCollector', res)
    ipcRenderer.send(IPCChannel.RENDER_MEMORY_INFO , Object.assign({}, {
      pid: process.pid
    }, res))
  }, CONFIG.renderLoopInterval)
}

function firstCollector() {
  window.addEventListener('load',async () => {
    // 避免阻塞，最多 10s 后执行
    requestIdleCallback(async () => {
      let res = await getRunningMemory({
        detailModel: true
      })
      console.log('render firstCollector', res)
    }, { timeout: 1e4 });
  })
}

function init() {
  firstCollector();
  loopCollector();
}

if (loopCollectorTimer === undefined) {
  init()
} 
