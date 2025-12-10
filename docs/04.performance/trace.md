# Tracing

Performance tracing and analysis for Electron applications.

## Overview

Learn how to trace and analyze performance in your Electron applications using various tools and techniques.

## Configuration Files

Basic tracing configuration

1. create and config trace-config.json file, read [chrome command line switch](https://peter.sh/experiments/chromium-command-line-switches/) to know config
2. start app with `xx --trace-config-file=trace-config.json`

> be careful trace-config-file name must be trace-config.json ,other file name not work, pay attention!

```json
{
  "startup_duration": 30,
  "result_file": "./trace.json",
  "trace_config": {
    "included_categories": [
      "blink,cc,gpu,renderer.scheduler,sequence_manager,v8,toplevel,viz"
    ],
    "excluded_categories": ["*"]
  }
}
```

### Memory Config

```json
{
  "startup_duration": 30,
  "result_file": "./trace.json",
  "trace_config": {
    "included_categories": ["disabled-by-default-memory-infra"],
    "memory_dump_config": {
      "triggers": [
        { "mode": "light", "periodic_interval_ms": 50 },
        { "mode": "detailed", "periodic_interval_ms": 1000 }
      ]
    }
  }
}
```

## Getting Started

1. Enable tracing in your application
2. Configure trace categories
3. Collect trace data
4. Analyze results

## Tools

- Chrome Tracing (chrome://tracing)
- Node.js built-in tracing
- Custom performance markers

## reference

- [analysis trace](https://blog.scottlogic.com/2019/05/21/analysing-electron-performance-chromium-tracing.html)
- [所有支持的事件](https://chromium.googlesource.com/chromium/src/+/main/base/trace_event/builtin_categories.h)
- [electron 22.3.27 支持的事件](https://chromium.googlesource.com/chromium/src/+/refs/tags/108.0.5359.215/base/trace_event/builtin_categories.h)
- [trace event profiling tool](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/)
