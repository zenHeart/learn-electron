const os = require('os-utils')

function getCpuMemData(cpuCount) {
  const freeMem = os.freemem() / 1024
  const totalMem = os.totalmem() / 1024
  const data = {
    cpuUsagePercent: (cpuCount * 100).toFixed(2),
    MemUsagePercent: ((totalMem - freeMem) / totalMem * 100.0).toFixed(2),
    freeMemG: freeMem.toFixed(2),
    totalMemG: totalMem.toFixed(2),
    usedMemG: (totalMem - freeMem).toFixed(2),
  }
  return data
}
function run() {
  return new Promise(resolve => {
    os.cpuUsage(percent => {
      const data = getCpuMemData(percent)
      resolve(data)
    })
  })
}
module.exports = run
