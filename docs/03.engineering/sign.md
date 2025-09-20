# 打包签名

签名是用来验证应用程序完整性和真实性的过程。

## 核心概念

**代码签名（Code signing）** 是对可执行文件或代码进行数字签名以确认软件作者及保证软件在签名后未被修改或损坏的措施。此措施使用加密散列来验证真实性和完整性。
**electron-forge（下称 forge）**：electron 官方提供的工程基建，是 electron-builder 的继任者。electron-forge 通过简单的插件系统实现了更好的扩展性，并且覆盖了从前端产物到最终安装包的全部流程，更适用于现代 electron 应用的生产环境。
**electron-packager（下称 packager）**：electron-forge 依赖的 app 部分的打包器，包含多平台产物组装、asar 打包、应用元信息修改、应用图标修改等功能
**electron-forge/maker（下称 maker）**：forge 内部概念，maker 用于将 packager 生产的应用产物包装成各个平台的安装器，如 dmg、deb、rpm、zip、msi、exe 等。

## 签名流程

### electron forge 签名

参考 [Signing a Windows app](https://www.electronforge.io/guides/code-signing/code-signing-windows)

1. electron-pacakge 完成
   1. 产物复制 
   2. 修改应用图标
   3. 修改应用元信息
   4. 代码签名
2. electron-froge
   1. 基于平台选择 maker、包含 `exe-maker、msi-maker、zip-maker`
   2. 签名构建产物

:::tip
windows 签名通常采用数字证书厂家提供的 U 盾，基于 U 盾的证书进行签名
:::

### 远程签名

1. electron-packageer
   1. 构建产物
   2. 上传对象存储
   3. 触发 gtilab 签名任务
2. 签名 @electron/windows-sign 包提供了 hookFunction 和 hookModulePath 的方式，交给用户完全自行实现签名过程，我们可以利用这个能力，实现上面的功能 [hook](https://github.com/electron/windows-sign?tab=readme-ov-file#with-a-custom-hook-function), 使用 gitlab ci 托管 windows runner，windows runner 使用 shell 作为 executor，可实现在 windows 机器上执行任务的需求。使用 gitlab API，实现在 签名hook 中触发 gitlab job 进行远程签名的能力。[gitlab api](https://docs.gitlab.com/ee/api/jobs.html)
   1. 解压产物
   2. 二进制签名
   3. 压缩
   4. 上传对象存储
  

## 方案

### 基于 electron-builder

```js
//  electorn-builder 配置
const { Singe } = require('xxx-singe')
 
const remoteSign = new Singe({
  // 配置
})
 
module.exports = {
  // ...
 
  // electron-builder 中 edit resource 和签名流程耦合在一起，afterSign 钩子执行时 edit resource 已完成，但是并未签名
  afterSign: remoteSign.afterSign,
 
  // 用于签名最终生成的制品（安装包等）
  afterAllArtifactBuild: remoteSign.afterAllArtifactBuild,
 
  // ...
}
```


### electron-forge

```js

const { RemoteSignPlugin, RemoteSignRunner } = require('sign');
const { dirname } = require('path');
 
module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      // 这里依赖了 @electron/windows-sign 的 hookModulePath 能力，可以将 squirrel 生成
      // 的可执行文件都签上名。整个打包流程会额外增加 4 次远程签名任务，耗时约 5-8 分钟
      config: {
        windowsSign: {
          hookModulePath: require.resolve('remote-sign'),
        }
      },
    }
    // ...
  ],
  plugins: [
    // ...
    new RemoteSignPlugin({/* 这里暂时什么都没有 */})
    // ...
  ],
};

```





## 延伸阅读
