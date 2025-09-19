# 快捷键

## 基本使用
1. 引入 `globalShortcut` 注册快捷键
2. 使用 `globalShortcut.register` 方法监听全局快捷键


## 使用技巧
### 功能键
* `CommandOrControl` 的平台差异性
  * macOS 为 `Command`
  * Linux 和 Windows 为 `Control`
* `Alt` 三个平台通用, `Option` 只针对 Mac
* `Super` 按键指代 Windows,Linux 的 `Windows` 按键,Mac 为 `Cmd` 按键