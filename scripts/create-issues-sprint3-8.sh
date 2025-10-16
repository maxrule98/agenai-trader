#!/usr/bin/env bash
set -euo pipefail

REPO="maxrule98/agenai-trader"

create() {
  local title="$1"; shift
  local body="$1"; shift
  local labels="$1"; shift
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
}

### SPRINT 3 — Risk & Execution v1
create "[RISK] Rule pack v1 (block & log)" $'Implement risk rules:\n- maxDailyLossPct, maxPosSymbolPct, maxGrossExposurePct\n- maxLeverage, cooldownAfterStopSec\n- staleFeedKill, slippageSpikeHalt\nAdd evaluator that short-circuits on first block and aggregates reasons.\n\n**Acceptance**\n- Unit tests for each rule including edge/breach cases\n- Structured NATS events on block\n- Docs in docs/plugins.md' "sprint-3,area:risk,type:feature,prio:high"

create "[EXEC] Binance adapter v1 (testnet): market/limit/post-only/IOC" $'Build REST+WS adapter with symbol/precision discovery, idempotent client IDs, retries with backoff.\n\n**Acceptance**\n- Place/cancel flows work on testnet\n- Post-only and IOC verified\n- Reconnect & resubscribe logic with jitter\n- Minimal README in packages/exec' "sprint-3,area:exec,type:feature,prio:high"

create "[EXEC] Client-side OCO & Trailing" $'Emulate OCO and trailing stops when venue lacks native features; ensure heartbeat updates and REST reconcile fallback.\n\n**Acceptance**\n- Correct linkage of child orders\n- Recovery after WS gap\n- Tests for trail step & OCO cancellation logic' "sprint-3,area:exec,type:feature"

create "[TRADER] Startup reconciliation" $'On boot, reconcile open orders & positions, detect orphan positions, and ensure safety stops in place.\n\n**Acceptance**\n- Dry-run logs what would be placed\n- Live testnet: safe reconciliation observed\n- Deterministic replay stays stable' "sprint-3,area:trader,type:feature"

create "[CB] Circuit breakers" $'Implement data-stall halt, daily DD halt+flatten, and slippage-spike temporary halt.\n\n**Acceptance**\n- Manual triggers for each path (for testing)\n- Halts are visible in UI via NATS events\n- Resume logic documented' "sprint-3,area:risk,type:feature"

### SPRINT 4 — Backtester & Walk-Forward
create "[SIM] OHLCV simulator (fees/slippage/latency)" $'Deterministic sim with fee/slippage/latency presets; policy/risk/exec stubs.\n\n**Acceptance**\n- Seeded RNG; golden fixtures\n- Perf baseline reported' "sprint-4,area:sim,type:feature,prio:high"

create "[SIM] Walk-forward runner" $'Implement rolling train/validate & anchored OOS; compute Sharpe, Sortino, MAR, MaxDD, p99 loss, hit-rate.\n\n**Acceptance**\n- Reports stored in MinIO + indexed in PG\n- Gateway exposes /reports/:runId' "sprint-4,area:researcher,type:feature"

create "[REPORT] Generator + artifacts" $'Generate JSON summary, CSV trades, PNG charts; upload to MinIO.\n\n**Acceptance**\n- Presigned links via gateway\n- CI builds minimal sample report' "sprint-4,area:researcher,type:feature"

### SPRINT 5 — UI: Strategy Builder & Live
create "[UI] Strategy Builder (schema-validated) + YAML preview" $'Form mapped to JSON Schema from @ai-quant/core; import/export; Save & Deploy Shadow.\n\n**Acceptance**\n- Client-side validation messages\n- Saved strategy visible in PG\n- Shadow deploy action calls gateway' "sprint-5,area:ui,type:feature,prio:high"

create "[GQL] Gateway schema & subscriptions" $'Queries: strategies, positions, pnl. Mutations: saveStrategy, deployStrategy, haltTrading. Subs: telemetry, fills, riskStatus.\n\n**Acceptance**\n- GraphQL Playground reachable\n- Example queries in docs/api-contracts.md' "sprint-5,area:gateway,type:feature"

create "[UI] Live dashboard (PnL, positions, risk lights, tape)" $'Realtime WS/GraphQL; basic candle overlay.\n\n**Acceptance**\n- Displays live changes\n- Risk lights react to circuit-breakers' "sprint-5,area:ui,type:feature"

### SPRINT 6 — Agentic AI & Ensemble
create "[ENSEMBLE] Contextual bandit (LinUCB/TS)" $'Route between AR4 & MACD by context (vol_bucket, trend, liquidity). Online update with bounded exploration.\n\n**Acceptance**\n- Synthetic-regime test shows regret decreases\n- Pluggable via plugins interface' "sprint-6,area:plugins,type:feature,prio:high"

create "[AI-CORE] gRPC scaffold + OB-transformer inference" $'Python service with single /infer endpoint; returns score/conf/horizon/version; registry loader by semver.\n\n**Acceptance**\n- Latency metrics emitted\n- Fallback to baseline on failure' "sprint-6,area:ai-core,type:feature,prio:high"

create "[TRADER] Shadow evaluation channel" $'Run micro-alpha in shadow; compare KPIs vs baseline over moving window.\n\n**Acceptance**\n- Shadow never places orders\n- Comparison logged & exposed to UI' "sprint-6,area:trader,type:feature"

create "[DEPLOYER] Promotion gates" $'MAR > X, MaxDD < Y, tail risk < Z; promote/demote with audit trail.\n\n**Acceptance**\n- Configurable thresholds in PG\n- Audit events stored' "sprint-6,area:orchestrator,type:feature"

### SPRINT 7 — Post-Trade Analytics & Planner
create "[ANALYTICS] PnL attribution tree" $'Aggregate fills by symbol → regime → alpha → policy → exec.\n\n**Acceptance**\n- Queryable via telemetry API\n- UI tree view' "sprint-7,area:analytics,type:feature,prio:high"

create "[ANALYTICS] Drift (PSI/KS) + win-rate decay alerts" $'Detect distribution drift; push alerts to Planner.\n\n**Acceptance**\n- Alert examples recorded in CH/PG\n- Docs: thresholds and playbooks' "sprint-7,area:telemetry,type:feature"

create "[ANALYTICS] Execution quality (slippage audit)" $'Track p50/p95 slippage, maker/taker split, cancel/replace stats.\n\n**Acceptance**\n- Dashboard panels in Grafana\n- Exported CSV for audits' "sprint-7,area:telemetry,type:feature"

create "[PLANNER] Experiment & caps scaling" $'Read KPIs; propose param sweeps, ensemble tuning, cap up/down steps; emit tasks to Researcher/Deployer.\n\n**Acceptance**\n- Actions logged with rationale\n- Idempotent tasks' "sprint-7,area:planner,type:feature,prio:high"

### SPRINT 8 — Multi-Venue SOR & L2 Sim
create "[EXEC] Bybit adapter (spot/perp)" $'Parity with Binance adapter; funding/borrow awareness.\n\n**Acceptance**\n- Testnet verified\n- Docs for config' "sprint-8,area:bybit,area:exec,type:feature,prio:high"

create "[SOR] Venue selection heuristics" $'Select venue by spread, depth, fees, recent fill quality; outage fallback.\n\n**Acceptance**\n- Simulated comparison script\n- Switch evidence in logs' "sprint-8,area:sor,type:feature,prio:high"

create "[RISK] Correlation heat rule" $'Rolling correlation matrix; cap same-direction aggregated exposure.\n\n**Acceptance**\n- Breach blocks new entries\n- Tests with synthetic correlated series' "sprint-8,area:risk,type:feature"

create "[SIM] L2 queue model (partial fills)" $'Naive queue-position estimation; partial fill distributions.\n\n**Acceptance**\n- Consistency checks vs OHLCV sim\n- Fixtures & golden files' "sprint-8,area:sim,type:feature"
