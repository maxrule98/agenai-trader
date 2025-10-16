# Sprint 7 — Post-Trade Analytics & Planner

Duration: ~2 weeks

## Goal

Deep analytics, drift detection, and automated planning for experiments and cap scaling.

## Deliverables

- PnL attribution tree (symbol → regime → alpha → policy → exec)
- Drift detection: PSI/KS on features and win-rate decay alerts
- Execution quality: slippage audit, maker/taker split, queue theory proxies
- Planner agent with rollout and cap scaling logic

## Tickets

### [ANALYTICS] Attribution

Path: apps/telemetry/src/attribution.ts

- Aggregate fills + tags → hierarchical PnL
- Export to CH tables; API to fetch tree

### [ANALYTICS] Drift detectors

Path: apps/telemetry/src/drift.ts

- PSI/KS on feature distributions vs training
- Alert to Planner via NATS

### [ANALYTICS] Execution quality

Path: apps/telemetry/src/execQuality.ts

- Slippage vs model, p50/p95, liquidity flag
- Maker/taker ratio; cancel/replace metrics

### [AGENT] Planner

Path: apps/orchestrator/src/planner.ts

- Read KPIs and alerts; propose:
  - param sweeps
  - bandit hyperparams
  - cap up/down steps
- Emit tasks to Researcher and Deployer

## DoD

- Attribution tree visible in UI
- Drift alerts show in dashboard and planner acts
- Cap scaling executed with audit record
