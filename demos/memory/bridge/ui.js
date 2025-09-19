const { invokeCurrentWindowFn } = require('./getWin')

// 最大化
function winMaximize() {
  return invokeCurrentWindowFn('maximize')
}

// 最小化
function winMinimize() {
  return invokeCurrentWindowFn('minimize')
}

module.exports = {
  winMaximize,
  winMinimize,
}
