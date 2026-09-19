// 这里没有 require / process / ipcRenderer —— 只有 window.api
// 因为 shared/ipc-contract.ts 声明了 global Window.api: API

document.getElementById('btn-get')?.addEventListener('click', async () => {
  const result = await window.api.getConfig('theme')
  console.log(result.value)
})

document.getElementById('btn-set')?.addEventListener('click', async () => {
  await window.api.setConfig('theme', 'dark')
  // @ts-expect-error —— 演示编译期类型检查：第二个参数必须是 string
  // await window.api.setConfig('theme', 123)
})

document.getElementById('btn-file')?.addEventListener('click', async () => {
  const path = await window.api.openFile([{ name: '图片', extensions: ['png', 'jpg'] }])
  console.log(path)
})

const off = window.api.onThemeChange((theme) => {
  console.log('主题变更', theme)
})
// 之后：off() 取消订阅