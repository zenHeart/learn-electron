# record hole in electron

## mac can't start

make sure open rosetta model, m1 may crash,
read [rosetta](https://www.electronjs.org/blog/apple-silicon#what-about-rosetta-2) to learn more

## Windows 分辨率导致 setPosition 失效

详见 [github issue](https://github.com/electron/electron/issues/9477)， 问题根因是获取窗口的高度不对了，所以每次显示之前重置一下窗口大小即可