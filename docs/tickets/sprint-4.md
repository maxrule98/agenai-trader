# Sprint 4 — Backtester & Walk-Forward

Duration: ~2 weeks

## Goal

Create an OHLCV simulator with slippage/latency/fees, run walk-forward, and produce artifacts and reports.

## Deliverables

- OHLCV simulator (deterministic)
- Fee/slippage/latency presets
- Walk-forward runner
- Report generator (JSON + charts)
- Storage in S3/MinIO + ClickHouse indexes

## Tickets

### [SIM] OHLCV engine

Path: packages/sim/src/ohlcvSim.ts

- Step through bars; call policy/risk/exec stubs
- Slippage models: fixed bps, spread-multiple
- Latency: ms delay; order fill probability simple model

### [SIM] Determinism & golden files

Path: packages/sim/test/replay.spec.ts

- Seeded RNG; stable outputs
- Golden artifacts under test/fixtures

### [SIM] Walk-forward runner

Path: apps/researcher/src/walkForward.ts

- Rolling windows (train/validate), anchored OOS
- Emit KPIs: Sharpe, Sortino, MAR, MaxDD, p99 loss, hit-rate

### [REPORT] Generator

Path: apps/researcher/src/report.ts

- JSON summary + CSV trades; small PNG charts
- Upload to MinIO; index in PG artifacts

### [GATEWAY] Expose reports

Path: apps/gateway/src/routes/reports.ts

- GET /reports/:runId (metadata + presigned links)

## DoD

- Reproduce baseline actions via replay
- WF results visible via gateway
- KPIs computed and stored with run metadata
