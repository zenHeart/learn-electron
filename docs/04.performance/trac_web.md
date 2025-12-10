# web trace

## Quick Start

see [capture trace on chrome](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/recording-tracing-runs/#capture-a-trace-on-chrome-desktop)

useful command

```bash
#  unix* just capture start 7s data save to foo.json
$CHROME --trace-startup --trace-startup-file=/tmp/foo.json --trace-startup-duration=7
# windows same but path use \
$CHROME --trace-startup --trace-startup-file=%temp%\foo.json --trace-startup-duration=7
```

## trace config

useful trace config

- `-trace-frame-viewer` can show flame charts
- `--perf` show performance throttle

## best practice

### how to be good recording

- [ ] make sure record not to long, max 10s
- [ ] focus on problem each times, if collect much info make sure each problem has a wait time to make easy identify
- [ ] normal with exception make sure before exception has normal data to help quickly clarify problem
