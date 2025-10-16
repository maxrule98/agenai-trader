# Sprint 2 — Features, Baseline Alphas, Policy

Duration: ~2 weeks

## Goal

Compute live features, produce baseline alpha signals (AR4, MACD), and convert to actions via a threshold policy with ATR brackets.

## Deliverables

- Feature Factory v1 (rolling stats, indicators)
- Alpha plugins: AR(4), MACD
- Threshold+ATR+hysteresis policy
- Typed events on NATS for features/signals/actions
- Unit tests and small synthetic fixtures

## Tickets

### [FEAT] Rolling window utils

Path: packages/features/src/rolling.ts

- SMA/EMA/WMA, variance/stddev, ATR, RSI, MACD
- Stable, allocation-free arithmetic where possible
  Acceptance: deterministic outputs vs fixtures

### [FEAT] Feature builder pipe

Path: packages/features/src/factory.ts

- Build Features from bars: returns, zscores, vol_bucket, trend_strength
- Cache via Redis with TTL; hot/cold start handling
  Acceptance: publishes v1.features.\* within 1s of bar close

### [ALPHA] AR4 plugin

Path: packages/plugins/src/alpha/ar4.ts

- AR(p=4) on 1-step returns with zscore normalization
- Output AlphaSignal [-1..1], conf, horizon
  Tests: edge cases (short history), NaN guards

### [ALPHA] MACD plugin

Path: packages/plugins/src/alpha/macd.ts

- MACD hist as signal; squash via tanh
  Tests: fast/slow/signal variations

### [POLICY] Threshold policy with ATR brackets

Path: packages/plugins/src/policy/thresholdAtr.ts

- Entry threshold + hysteresis
- Brackets: stop=ATR\*k, TP ladder x2
- Mirror for shorts
  Tests: transitions, hysteresis, bracket math

### [TRADER] Wire compute path

Path: apps/trader/src/index.ts

- Subscribe features → run alphas → policy → publish actions
- Structured logging with correlation ids
  Acceptance: actions visible on bus for test stream

## DoD

- Types + Zod boundary validation
- Unit tests pass >90% lines for feature/policy math
- Replay harness can inject feature stream and reproduce actions
