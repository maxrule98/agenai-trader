# Sprint 3 — Risk & Execution v1

Duration: ~2 weeks

## Goal

Enforce hard guardrails and place orders on Binance Testnet with idempotent routing, OCO/trailing emulation, and reconciliation.

## Deliverables

- Risk Rule Pack v1
- Binance testnet adapter (market/limit/post-only/IOC)
- Client-side OCO + trailing
- Reconciliation loop on startup
- Circuit breakers (stale feed, DD breach)

## Tickets

### [RISK] Rule pack v1

Path: packages/plugins/src/risk/

- maxDailyLossPct, maxPosSymbolPct, maxGrossExposurePct
- maxLeverage, cooldownAfterStopSec
- staleFeedKill, slippageSpikeHalt
  Evaluator: short-circuits on block; aggregates reasons

### [EXEC] Binance testnet adapter

Path: packages/exec/src/binance.ts

- REST+WS; symbols/precision/fees discovery
- place/cancel; post-only and IOC flags
- Idempotent clientId: hash(action,t,nonce)
  Retry/backoff on transient errors

### [EXEC] OCO + trailing emulation

Path: packages/exec/src/advanced.ts

- Heartbeat updater; shadow-native if venue supports
- Robust to WS gap via periodic REST reconcile

### [TRADER] Reconciliation on boot

Path: apps/trader/src/reconcile.ts

- Load open orders & positions; diff vs internal state; repair
- Detect orphan positions; place safety stops

### [CB] Circuit breakers

Path: apps/trader/src/circuitBreakers.ts

- Data stall → halt
- Daily DD ≥ limit → flatten + halt
- Slippage p95 spike → temporary halt
  Acceptance: manual trigger switches state to HALTED

## DoD

- Testnet orders visible; cancels clean
- Risk blocks reflected in logs + NATS events
- Restart preserves safety via reconcile
