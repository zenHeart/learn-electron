// 渲染进程（sandbox + contextIsolation 都开）：这里既没有 require，也没有 ipcRenderer
// 能做的全部事情 = window.api 上挂的几个方法
const $ = (id) => document.getElementById(id)
const out = (id, msg) => { $(id).textContent = msg }

// 演示 1：invoke / handle + 错误传播
$('btn-config').addEventListener('click', async () => {
  try {
    const r = await window.api.getConfig('theme')
    out('out-config', JSON.stringify(r))
  } catch (e) {
    out('out-config', '【错误】' + e.message)
  }
})
$('btn-config-bad').addEventListener('click', async () => {
  try {
    const r = await window.api.getConfig('__proto__')
    out('out-config', JSON.stringify(r))
  } catch (e) {
    out('out-config', '【预期错误】' + e.message)
  }
})

// 演示 2：系统能力封装
$('btn-file').addEventListener('click', async () => {
  const path = await window.api.openFile([{ name: '图片', extensions: ['png', 'jpg'] }])
  out('out-file', path ?? '（取消）')
})

// 演示 3：白名单验证
$('btn-safe-url').addEventListener('click', () => window.api.openExternal('https://electronjs.org/'))
$('btn-bad-url').addEventListener('click', async () => {
  try {
    await window.api.openExternal('javascript:alert(1)')
  } catch (e) {
    alert('被白名单挡住：' + e.message)
  }
})

// 演示 4：事件订阅 + 取消
let unsubscribe = null
$('btn-subscribe').addEventListener('click', () => {
  unsubscribe = window.api.onThemeChange((t) => out('out-event', '主题变更为：' + t))
  out('out-event', '（已订阅）')
})
$('btn-unsubscribe').addEventListener('click', () => {
  unsubscribe?.()
  unsubscribe = null
  out('out-event', '（已取消订阅）')
})

// 自我验证：现代默认值下页面里没有 Node 能力
console.log('typeof require =', typeof require)
console.log('typeof process =', typeof process)
console.log('typeof window.api =', typeof window.api)