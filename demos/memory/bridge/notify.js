const { getCurrentWindow } = require('./getWin')


function winFlash() {
  const curWin = getCurrentWindow()
  if (!curWin.isFocused()) {
    curWin.flashFrame(true)
    curWin.once('focus', () => {
      curWin.flashFrame(false)
    })
  }
}


module.exports = {
  winFlash,
}
