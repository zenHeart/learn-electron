// shared/ipc-contract.ts —— 唯一事实来源
// 主进程 / preload / 渲染层都引用此文件

// 通道名作为 const 断言 + 字面量联合类型 —— 拼错会编译报错
export const IPC = {
  configGet: 'config:get',
  configSet: 'config:set',
  dialogOpen: 'dialog:openFile',
  shellOpenExternal: 'shell:openExternal'
} as const

export type IpcChannel = typeof IPC[keyof typeof IPC]

// 主进程 handler 签名
export interface IpcHandlerMap {
  'config:get': (event: unknown, key: string) => Promise<{ key: string; value: string | null }>
  'config:set': (event: unknown, payload: { key: string; value: string }) => Promise<void>
  'dialog:openFile': (
    event: unknown,
    filters?: { name: string; extensions: string[] }[]
  ) => Promise<string | null>
  'shell:openExternal': (event: unknown, url: string) => Promise<void>
}

// preload 暴露给渲染层的 API 类型
export interface API {
  getConfig(key: string): Promise<{ key: string; value: string | null }>
  setConfig(key: string, value: string): Promise<void>
  openFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null>
  openExternal(url: string): Promise<void>
  onThemeChange(callback: (theme: string) => void): () => void
}

// 渲染层全局类型扩展
declare global {
  interface Window {
    api: API
  }
}