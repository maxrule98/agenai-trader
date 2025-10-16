#!/usr/bin/env bash
set -euo pipefail

REPO="maxrule98/agenai-trader"

create() {
  local title="$1"
  local body="$2"
  local labels="$3"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
}

create "[CORE] Define Zod schemas & JSON Schema export" $'Implement canonical data contracts in `packages/core/src/types.ts` using Zod.\n\n**Acceptance Criteria**\n- Zod schemas: Bar, L2Update, Features, AlphaSignal, Action, RiskVerdict\n- JSON Schema bundle generated (e.g., `packages/core/schema.json`)\n- Vitest round-trip tests\n- Docs: README in `packages/core/`' "sprint-1,area:core,type:feature,prio:high"

create "[INFRA] Docker compose dev stack" $'Add `infra/docker/compose.dev.yml` for NATS, ClickHouse, Postgres, Redis, MinIO, Grafana.\n\n**Acceptance Criteria**\n- Compose up -> healthy\n- Healthchecks\n- README and envs match `.env.example`' "sprint-1,area:infra,type:chore"

create "[STORAGE] ClickHouse & Postgres migrations" $'Create migrations for CH and PG.\n\n**Acceptance Criteria**\n- CH: bars, fills, actions, telemetry\n- PG: strategies, artifacts, deployments, users\n- Runnable migration scripts\n- READMEs under `packages/storage/`' "sprint-1,area:storage,type:feature"

create "[MARKET-IO] Binance WS multiplexer" $'Implement `packages/market-io/src/binanceWs.ts` to consume aggTrades/bookTicker and publish normalized events to NATS.\n\n**Acceptance Criteria**\n- Auto-resubscribe with jittered backoff\n- Heartbeat monitoring\n- Publish to `v1.market.*`' "sprint-1,area:market-io,type:feature"

create "[MARKET-IO] 1m bar aggregator" $'Build `packages/market-io/src/barAggregator.ts` to assemble 1m bars and persist to CH.\n\n**Acceptance Criteria**\n- Emits `v1.market.bars.{exch}.{symbol}.1m`\n- Writes to CH with retries\n- Example subscriber script' "sprint-1,area:market-io,type:feature"

create "[SIM] Deterministic replay harness (golden files)" $'Create `packages/sim/src/replay.ts` and tests to deterministically re-emit a session log.\n\n**Acceptance Criteria**\n- Seeded RNG, stable hashes\n- Golden fixtures under `packages/sim/test/fixtures`\n- CI passes' "sprint-1,area:sim,type:test"

create "[OBS] Observability baseline" $'Wire JSON logging with correlation IDs and OTEL spans.\n\n**Acceptance Criteria**\n- Logger util with standard keys\n- Spans around ingest/aggregation\n- Grafana dashboard JSON committed' "sprint-1,area:observability,type:feature"

create "[DOCS] README/Getting started & envs" $'Add root README and tighten `.env.example`.\n\n**Acceptance Criteria**\n- Clear dev steps\n- Links to docs\n- Env parity with compose services' "sprint-1,area:docs,type:docs"

create "[FEAT] Rolling window utilities" $'Implement `packages/features/src/rolling.ts` for SMA/EMA/WMA, variance/stddev, ATR, RSI, MACD.\n\n**Acceptance Criteria**\n- Allocation-aware arithmetic\n- Deterministic fixtures' "sprint-2,area:features,type:feature"

create "[FEAT] Feature factory" $'Create `packages/features/src/factory.ts` to build `Features` from bars: returns, z-scores, vol_bucket, trend_strength.\n\n**Acceptance Criteria**\n- Publishes `v1.features.*`\n- Redis cache/TTL\n- Zod validation' "sprint-2,area:features,type:feature"

create "[ALPHA] AR(4) plugin" $'`packages/plugins/src/alpha/ar4.ts` AR(p=4) over returns.\n\n**Acceptance Criteria**\n- Standardized AlphaSignal\n- Short history guards and tests' "sprint-2,area:plugins,type:feature"

create "[ALPHA] MACD plugin" $'`packages/plugins/src/alpha/macd.ts` using MACD histogram → tanh score.\n\n**Acceptance Criteria**\n- Configurable params\n- Unit tests' "sprint-2,area:plugins,type:feature"

create "[POLICY] Threshold + ATR + hysteresis" $'`packages/plugins/src/policy/thresholdAtr.ts` to convert signals to Action.\n\n**Acceptance Criteria**\n- Entry threshold/hysteresis\n- Brackets: stop=ATR*k, TP ladder x2\n- Short symmetry tests' "sprint-2,area:plugins,type:feature"

create "[TRADER] Wire features→alphas→policy" $'`apps/trader/src/index.ts` subscribes to features, runs plugins, and publishes actions.\n\n**Acceptance Criteria**\n- NATS subjects per spec\n- Correlation IDs in logs\n- Dry-run env flag' "sprint-2,area:trader,type:feature"

create "[DOCS] Feature/alpha/policy guides" $'Add `docs/feature_factory.md` and `docs/plugins.md` with examples and subject schemas.' "sprint-2,area:docs,type:docs"
