# debug

## main process

1. run in bash `/Applications/xx.app/Contents/MacOS/xxx --inspect-brk=5858`
2. open <chrome://inspect>, choice Devices menu
3. choice Discover network targets,click Config add `localhost:5858`
4. now will trigger debug mode

you can inject this in main process to trigger devtools for all windows

```javascript
const { BrowserWindow } = require("electron");
// trigger devtools
BrowserWindow.getAllWindows().map((win) => win.webContents.openDevTools());
```

## render process

check [stackoverflow](https://stackoverflow.com/questions/45485262/how-to-debug-electron-production-binaries)

1. run in bash `open /Applications/xxx.app --inspect-brk --args --remote-debugging-port=8315`
2. open <http://localhost:8315>

## net debug

```bash
electron.exe --log-net-log=netlog.json
```

访问 <https://netlog-viewer.appspot.com/#events> 导入 netlog 文件分析错误
详情参考 [netlog](https://textslashplain.com/2020/04/08/analyzing-network-traffic-logs-netlog-json/)

## other method

### lldb

1. `scripts/electron_debug.sh /Application/xx.app  &&  lldb /Applications/xxx.app`

## asar 解析

```bash
npm i -g @electron/asar
asar e app.asar ~/Desktop/app
```

## useful options

- `--show-fps-counter` 可以在 electron 上显示 fps 帧率和 gpu 内存使用情况
