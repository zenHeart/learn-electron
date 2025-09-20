# 主进程 preload 注入

由于 electron 存在主进程和渲染进程，对于一些关键信息收集例如主进程和渲染进程运行状态，异常信息，希望可以把所有采集代码放在一处，避免需要同时在主进程和渲染进程的仓库中注入两份代码。

## 方案
参考 sentry 的核心逻辑，详见 [sentry-electron preload-injection](https://github.com/getsentry/sentry-electron/blob/master/src/main/integrations/preload-injection.ts#L35) 核心代码如下

```ts
 setup(client) {
      const options = client.getOptions() as ElectronMainOptionsInternal;
 
      // If classic IPC mode is disabled, we shouldn't attempt to inject preload scripts
      // eslint-disable-next-line no-bitwise
      if ((options.ipcMode & IPCMode.Classic) === 0) {
        return;
      }
 
      app.once('ready', () => {
        const path = getPreloadPath();
 
        if (path && typeof path === 'string' && isAbsolute(path) && existsSync(path)) {
          for (const sesh of options.getSessions()) {
            // Fetch any existing preloads so we don't overwrite them
            const existing = sesh.getPreloads();
            sesh.setPreloads([path, ...existing]);
          }
        } else {
          logger.log(
            'The preload script could not be injected automatically. This is most likely caused by bundling of the main process',
          );
        }
      });
    }
```

注意该种情况只使用与未自定义 session 的情况若自定义了 session 可以采用如下方式注入 ，该方法会监听新的 web-contents 创建，并自动注入
render.js 用于采集信息

```ts
function injectPreloadScript() {
  app.on('web-contents-created', (_event, contents) => {
    try {
      const path = require.resolve('./renderer.js')
      const sesh = contents.session
      const existing = sesh.getPreloads()
      sesh.setPreloads([path, ...existing])
    } catch(err) {
      tracker.injectError({
        message: err.message,
      })
    }
  })
}
 
```