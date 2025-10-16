# Sprint 6 — Agentic AI & Ensemble

Duration: ~2 weeks

## Goal

Introduce contextual bandit ensemble, scaffold ai-core, and run a micro-alpha in shadow.

## Deliverables

- LinUCB/Thompson bandit over AR4 & MACD
- ai-core gRPC with one inference endpoint
- Shadow evaluation tooling & promotion gates in Deployer

## Tickets

### [ENSEMBLE] Contextual bandit

Path: packages/plugins/src/ensemble/bandit.ts

- Context features: vol_bucket, trend, liquidity
- Arms: ar4, macd
- Online updates with bounded exploration
  Tests: regret decreases on synthetic regimes

### [AICORE] gRPC server scaffold

Path: services/ai-core/\*

- Python FastAPI/gRPC hybrid
- /infer/ob-transformer: accept L2 snapshot; return score/conf/horizon
- Model registry loader with semantic version

### [TRADER] Shadow evaluation

Path: apps/trader/src/shadow.ts

- Run baseline + micro-alpha in parallel; no orders from shadow
- Compare KPIs over moving window; log deltas

### [DEPLOYER] Promotion gates

Path: apps/orchestrator/src/deployer.ts

- Define gates: MAR > X, MaxDD < Y, tail risk < Z
- Promote/demote with audit trail

## DoD

- Ensemble improves live shadow KPIs on sample feed
- ai-core inference reachable and logged
- Gates enforce promotion only when safe
