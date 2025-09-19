
const IPCChannel = {
  RENDER_MEMORY_INFO: 'RENDER_MEMORY_INFO'
}

const isMacOs = process.platform === 'darwin'
const SIZE_UNIT = {
  B: 'B',
  KB: 'KB',
  MB: 'MB',
  GB: 'GB'
}
const SIZE_CONVERTOR = {
  [SIZE_UNIT.B]: {
    [SIZE_UNIT.B]: 1,
    [SIZE_UNIT.KB]: 1 / 1024,
    [SIZE_UNIT.MB]: 1 / (1024 * 1024),
    [SIZE_UNIT.GB]: 1 / (1024 * 1024 * 1024)
  },
  [SIZE_UNIT.KB]: {
    [SIZE_UNIT.B]: 1024,
    [SIZE_UNIT.KB]: 1,
    [SIZE_UNIT.MB]: 1 / 1024,
    [SIZE_UNIT.GB]: 1 / (1024 * 1024)
  },
  [SIZE_UNIT.MB]: {
    [SIZE_UNIT.B]: 1024 * 1024,
    [SIZE_UNIT.KB]: 1024,
    [SIZE_UNIT.MB]: 1,
    [SIZE_UNIT.GB]: 1 / 1024
  },
  [SIZE_UNIT.GB]: {
    [SIZE_UNIT.B]: 1024 * 1024 * 1024,
    [SIZE_UNIT.KB]: 1024 * 1024,
    [SIZE_UNIT.MB]: 1024,
    [SIZE_UNIT.GB]: 1
  }
}

const CONFIG = {
  PREFIX: '__WALLE_IPC__',
  mainLoopInterval: 5 * 1e3, // 默认 5 分钟
  renderLoopInterval: 10 * 1e3, // 默认 10 分钟
  // mainLoopInterval: 5 * 60 * 1e3, // 默认 5 分钟
  // renderLoopInterval: 10 * 60 * 1e3, // 默认 10 分钟
}

function sizeConvertor(size, unit = SIZE_UNIT.KB, convertUnit = SIZE_UNIT.MB) {
  return size * SIZE_CONVERTOR[unit][convertUnit]
}

function humanMemInfo(memInfo, options = {
  unit: SIZE_UNIT.KB,
  convertUnit: SIZE_UNIT.MB,
  ignoreKeys: []
}) {
  return  Object.keys(memInfo).reduce((res,memKey) => {
    if(options?.ignoreKeys?.includes?.(memKey)) return res
    let memFieldKB = memInfo[memKey]
    let memFieldMB = sizeConvertor(memFieldKB, options.unit, options.convertUnit)
    res[memKey] = `${memFieldMB}MB`
    return res
  }, {})
}


exports.humanMemInfo = humanMemInfo
exports.isMacOs = isMacOs
exports.IPCChannel = IPCChannel
exports.SIZE_UNIT = SIZE_UNIT
exports.CONFIG = CONFIG