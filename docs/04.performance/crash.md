# crash 采集

## 主进程

依托 [Crashpad](https://chromium.googlesource.com/crashpad/crashpad/+/refs/heads/main/README.md) 实现, Electron 消费

[crashReporter](https://www.electronjs.org/docs/latest/api/crash-reporter) 实现上报， 示例逻辑如下

```js
const { crashReporter } = require('electron')
 
crashReporter.start({
  extra: {
    extraparams: 'extraparams'
  },
  submitURL: 'sentry xxx'
})
```

:::tip
可以通过商保的 extra 字段传递更多的上下文信息
:::

