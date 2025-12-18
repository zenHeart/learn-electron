# commandline switch and flags

## introduction

you can use commandline switch to set flags control electron features.there has 3 types flags

1. **electron flags** config electron feature
2. **chromium flags** config chromium feature
3. **node flags** config nodejs feature

for control this flags also has 4 types

1. use api like, see [CommandLine class](https://github.com/electron/electron/blob/v22.3.27/docs/api/command-line.md#commandlineappendswitchswitch-value)
2. add command line in command like `xx.exe --flags`, read [command-line-switches](https://github.com/electron/electron/blob/v22.3.27/docs/api/command-line-switches.md)
3. use environment ，read [environment variable see detail](https://github.com/electron/electron/blob/v22.3.27/docs/api/environment-variables.md)
   1. `NODE_OPTIONS` control node options
4. use config to control some running features ,see [web preferences](https://github.com/electron/electron/blob/main/docs/api/structures/web-preferences.md?inline)

after this chapter you will know normal use case in flags control

## switch and flag type

### chromium

chromium has many switch and flags you can see

- [chromium-command-line-switches/](https://peter.sh/experiments/chromium-command-line-switches/) it list all current chromium command switch, be careful different version has different switch search source code to see some certain switch support
- you can access [chrome://flags](chrome://flags) to control different feature

## control flags and switch type

### api

you can use [CommandLine Class](https://github.com/electron/electron/blob/main/docs/api/command-line.md) api to control flag

```js
const { app } = require("electron");

app.commandLine.hasSwitch("disable-gpu");
```

|api name| function| demo | description|
appendSwitch|add a switch| `app.commandLine.appendSwitch('remote-debugging-port', '8315')`| set remote debug port 8315
appendArgument|set flag value|`app.commandLine.appendArgument('--enable-experimental-web-platform-features')`|enable some feature
hasSwitch|check switch exist, be careful it just check the value set not validator the switch is illegal|`app.commandLine.hasSwitch('disable-gpu')`|check switch exist
getSwitchValue|get switch value|`app.commandLine.getSwitchValue('remote-debugging-port')`|get switch value
removeSwitch|remove switch|`app.commandLine.removeSwitch('disable-gpu')`|remove switch

#### appendSwitch VS appendArgument

for add custom command line arguments use appendArgument, appendSwitch only for use set innner chromium flags

#### enable features

in chromium some feature has command line switch , so you can use like `appendSwitch('xx')` to control this feature.
to make sure this feature work follow this step

1. search electron match chromium to confirm has this command line switch
2. set in electron to make it really work

other chromium feature maybe no export any switch, this time you can use like `enable-features` or `disable-features`， be careful when you use this feature
match your electron versions ,you can search `kEnableFeatures` `kDisableFeatures` code in [feature_list.cc](https://github.com/electron/electron/blob/v22.3.27/shell/browser/feature_list.cc#L25C49-L25C64)
in chrome [base_switch.cc](https://github.com/chromium/chromium/blob/108.0.5359.235/base/base_switches.cc#L18)

reference like [electron issue 18253 chrome 'flags'](https://github.com/electron/electron/issues/18253)

```js
// disable features
app.commandLine.appendSwitch(
  "disable-features",
  "HardwareMediaKeyHandling,MediaSessionService"
);

// enable features
app.commandLine.appendSwitch(
  "enable-features",
  "HardwareMediaKeyHandling,MediaSessionService"
);
```

you can search [chrome://flags](chrome://flags) to see support flags, for check some flags work you also can search in certain version test code to find
useful information. for example if you want to know how to disable composition video overlay feature work in chromium 108.0.5359.235 search code in source .
you will find [--disable-direct-composition-video-overlays in gpu_tests](https://github.com/chromium/chromium/blob/108.0.5359.235/content/test/gpu/gpu_tests/common_browser_args.py) this tell you
this feature can work in this chromium.
