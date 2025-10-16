# Logging Keys

| Key        | Type   | Description                  |
| ---------- | ------ | ---------------------------- |
| level      | string | info, warn, error, debug     |
| ts         | string | ISO8601 timestamp            |
| module     | string | package or agent name        |
| strategyId | string | current strategy             |
| symbol     | string | market symbol                |
| exch       | string | exchange id                  |
| msg        | string | short human-readable summary |
| context    | object | optional extra info          |

Example:
{"level":"info","ts":"2025-10-16T10:30:21Z","module":"trader","strategyId":"btc-ar4","symbol":"BTC/USDT","exch":"BINANCE","msg":"Placed post-only order","context":{"price":66842.5,"size":0.02}}
