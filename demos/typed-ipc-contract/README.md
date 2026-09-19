# typed IPC contract · TypeScript 共享类型契约

> 关联：[IPC 通信](/part2-core/09-ipc) · [工程脚手架](/part3-engineering/15-scaffold) · 难度 ★★★

把 IPC 通道名 + 请求 / 响应 / 事件载荷全部外化成 TypeScript 类型，让 **preload 与主进程共享一份契约**——编译器替你拦截「通道名拼错」「参数类型不匹配」「返回值用错」三类常见错误。

## 思路

```text
                     shared/ipc-contract.ts
                       （唯一事实来源）
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
   preload 引用此文件                       主进程引用此文件
   contextBridge.exposeInMainWorld<API>    ipcMain.handle<IpcHandlerMap[K]>(K, ...)
              │
              ▼
   渲染层 window.api.getConfig(key) —— 完全类型安全
```

**单一事实来源**：通道字符串常量、参数类型、返回类型都在 `shared/ipc-contract.ts` 里。主进程和 preload 都 `import` 它，渲染层的 `window.api` 也由 preload 显式声明类型。

## 文件清单

```text
typed-ipc-contract/
├── package.json              # 含 TypeScript + tsx（开发模式直接跑）
├── tsconfig.json             # 共享严格模式
├── shared/
│   └── ipc-contract.ts       # 通道定义 + 类型契约（★ 唯一事实来源）
├── main.ts                   # 主进程：用 IpcHandlerMap 约束 handler
├── preload.ts                # 桥接：用 API 约束 contextBridge.exposeInMainWorld
├── index.html
├── renderer.ts               # 渲染层：完全类型安全的 window.api 调用
└── README.md
```

## shared/ipc-contract.ts —— 唯一事实来源

```ts
// 通道名作为 const 断言 + 字面量联合类型 —— 拼错会编译报错
export const IPC = {
  configGet: 'config:get',
  configSet: 'config:set',
  dialogOpen: 'dialog:openFile',
  shellOpenExternal: 'shell:openExternal'
} as const

export type IpcChannel = typeof IPC[keyof typeof IPC]

// 主进程 handler 签名：(event, payload) => Promise<result> | result
export interface IpcHandlerMap {
  'config:get': (event: unknown, key: string) => Promise<{ key: string; value: string | null }>
  'config:set': (event: unknown, payload: { key: string; value: string }) => Promise<void>
  'dialog:openFile': (event: unknown, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  'shell:openExternal': (event: unknown, url: string) => Promise<void>
}

// preload 暴露给渲染层的 API 类型（contextBridge.exposeInMainWorld<API>）
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
```

## main.ts —— 用 IpcHandlerMap 约束 handler

```ts
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'node:path'
import { IPC, type IpcHandlerMap } from './shared/ipc-contract'

const ALLOWED_KEYS = new Set(['theme', 'locale', 'auto-launch'])

const createWindow = () => {
  const win = new BrowserWindow({
    width: 720,
    height: 520,
    webPreferences: { preload: join(__dirname, 'preload.js') }
  })
  win.loadFile('index.html')
}

// 注册 handler：channel 名是 IPC.configGet，handler 签名必须匹配 IpcHandlerMap[channel]
function registerHandler<K extends keyof IpcHandlerMap>(
  channel: K,
  handler: IpcHandlerMap[K]
) {
  ipcMain.handle(channel, handler as any)
}

registerHandler('config:get', async (_event, key) => {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`未注册的 key: ${key}`)
  return { key, value: process.env[`APP_${key.toUpperCase()}`] ?? null }
})

registerHandler('config:set', async (_event, { key, value }) => {
  if (!ALLOWED_KEYS.has(key)) throw new Error(`未注册的 key: ${key}`)
  // 真生产：写入 app.getPath('userData') 下的配置文件
  console.log(`set ${key} = ${value}`)
})

registerHandler('dialog:openFile', async (_event, filters) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: filters ?? [{ name: '所有文件', extensions: ['*'] }]
  })
  return canceled ? null : filePaths[0]
})

registerHandler('shell:openExternal', async (_event, url) => {
  if (!/^https:\/\//.test(url)) throw new Error('只允许 https')
  await shell.openExternal(url)
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

## preload.ts —— contextBridge<API> 让 window.api 类型安全

```ts
import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type API } from './shared/ipc-contract'

const ALLOWED_KEY_RE = /^(theme|locale|auto-launch)$/

// exposeInMainWorld 的第二个参数经过类型约束 → window.api 完全类型安全
contextBridge.exposeInMainWorld('api', {
  getConfig(key) {
    if (typeof key !== 'string' || !ALLOWED_KEY_RE.test(key)) {
      return Promise.reject(new Error('非法的配置键'))
    }
    return ipcRenderer.invoke(IPC.configGet, key)
  },

  setConfig(key, value) {
    if (typeof key !== 'string' || !ALLOWED_KEY_RE.test(key)) {
      return Promise.reject(new Error('非法的配置键'))
    }
    return ipcRenderer.invoke(IPC.configSet, { key, value })
  },

  openFile(filters) {
    return ipcRenderer.invoke(IPC.dialogOpen, filters)
  },

  openExternal(url) {
    return ipcRenderer.invoke(IPC.shellOpenExternal, url)
  },

  onThemeChange(callback) {
    const listener = (_e: unknown, theme: string) => callback(theme)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  }
} satisfies API)
```

## renderer.ts —— 完全类型安全的窗口 API

```ts
// 这里没有 require / process / ipcRenderer —— 只有 window.api
// 因为 shared/ipc-contract.ts 声明了 global Window.api: API，
// TypeScript 知道 window.api 上每个方法的入参与返回类型

document.getElementById('btn-get')?.addEventListener('click', async () => {
  // ✅ 类型推断：result = { key: string; value: string | null }
  const result = await window.api.getConfig('theme')
  console.log(result.value)  // string | null
})

document.getElementById('btn-set')?.addEventListener('click', async () => {
  // ✅ 编译期就报：第二个参数必须是 { key, value }
  await window.api.setConfig('theme', 'dark')
  // ❌ 编译错误：Argument of type '123' is not assignable to parameter of type 'string'
  // await window.api.setConfig('theme', 123)
})

document.getElementById('btn-file')?.addEventListener('click', async () => {
  const path = await window.api.openFile([{ name: '图片', extensions: ['png', 'jpg'] }])
  console.log(path)  // string | null
})

// 事件订阅返回取消函数
const off = window.api.onThemeChange((theme) => {
  console.log('主题变更', theme)  // theme 是 string
})
// 之后：off() 取消订阅
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["shared/**/*.ts", "main.ts", "preload.ts", "renderer.ts"]
}
```

## package.json

```json
{
  "name": "electron-typed-ipc-contract",
  "version": "0.1.0",
  "main": "main.ts",
  "scripts": {
    "build:main": "tsc main.ts --outDir dist --target ES2022 --module CommonJS",
    "build:preload": "tsc preload.ts --outDir dist --target ES2022 --module CommonJS",
    "build:renderer": "tsc renderer.ts --outDir dist --target ES2022 --module ESNext",
    "build:shared": "tsc shared/ipc-contract.ts --outDir dist --target ES2022 --module ESNext --declaration",
    "build": "pnpm build:shared && pnpm build:main && pnpm build:preload && pnpm build:renderer",
    "start": "electron dist/main.js",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "electron": "^31.0.0",
    "typescript": "^5.4.0"
  }
}
```

## 编译期捕获的常见错误

| 写法 | 编译结果 |
|---|---|
| `window.api.setConfig('theme', 123)` | ❌ `Argument of type '123' is not assignable to parameter of type 'string'` |
| `ipcRenderer.invoke('confg:get', key)` | ❌ `Argument of type '"confg:get"' is not assignable to parameter of type 'IpcChannel'` |
| `window.api.onThemeChange(123)` | ❌ `Argument of type '123' is not assignable to parameter of type '(theme: string) => void'` |
| `preload.ts` 漏写某个 `satisfies API` 字段 | ❌ `Property 'openExternal' is missing in type ...` |
| `main.ts` 的 handler 返回类型与契约不一致 | ❌ `Type '(event, key) => string' is not assignable to type '...'` |

## 常见错误

| 错误 | 后果 | 正解 |
|---|---|---|
| 通道名在主进程与 preload 各写一遍字符串 | 改一处忘改另一处，运行时报「no handler registered」 | 用 `IPC.configGet` 这种 const 引用 |
| 只给主进程写类型，preload 用 `any` | 渲染层的 `window.api` 没类型保护 | preload 与主进程共享同一份 `IpcHandlerMap` / `API` |
| 把 `API` 接口随便写在 preload 文件里，主进程 import 不进来 | 主进程注册 handler 时类型对不上 | `API` 放在 `shared/` 下，主进程、preload、渲染层都能 import |
| 用 enum 而不用 `as const` + 字面量联合 | enum 在编译后是对象，传字符串字面量会报错 | 用 `as const` 加 `typeof` 推导 |
| `satisfies API` 写成 `as API` | 失去溢出属性检查 | `satisfies` 同时校验字面量形状并保留字面量类型 |

## 跑起来

```bash
cd demos/typed-ipc-contract
pnpm install
pnpm build
pnpm start
```

或在 IDE 里直接看 `renderer.ts` 里被注释掉的 `// ❌ 编译错误` 行——把注释去掉保存，TypeScript 即时报红。