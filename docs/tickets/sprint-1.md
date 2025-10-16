# Sprint 1 - Boot and Contracts

Duration: ~2 weeks  
Goal: stand up the monorepo, core schemas, data ingestion, and deterministic replay harness.

## Deliverables

- Monorepo with pnpm workspaces and TS config
- Core Zod schemas for Bar, L2Update, Features, AlphaSignal, Action, RiskVerdict
- NATS broker running via docker compose
- ClickHouse, Postgres, Redis, MinIO up via docker compose
- Market IO: Binance WS ingestion and 1m bar aggregator
- Storage: CH and PG migrations
- Golden-file replay harness scaffold

## Tickets

### [CORE] Zod schemas and JSON Schema export

- Path: `packages/core/src/types.ts`
- Tasks:
  - Define Zod schemas for Bar, L2Update, Features, AlphaSignal, Action, RiskVerdict
  - Export types and compile JSON Schema bundle for UI
  - Add vitest covering round-trip validate → serialize → validate
- Acceptance:
  - `pnpm test` passes
  - JSON Schema artifact built

### [INFRA] docker compose stack

- Path: `infra/docker/compose.dev.yml`
- Tasks:
  - NATS, ClickHouse, Postgres, Redis, MinIO, Grafana
  - Seed scripts and healthchecks
- Acceptance:
  - `docker compose up -d` brings services healthy
  - Basic connection tests pass

### [STORAGE] migrations

- Paths: `packages/storage/*`
- Tasks:
  - CH tables: bars, fills, actions, telemetry
  - PG tables: strategies, artifacts, deployments, users
  - Provide simple migration scripts
- Acceptance:
  - Migrations run clean on dev stack

### [MARKET-IO] Binance WS multiplexer

- Path: `packages/market-io/src/binanceWs.ts`
- Tasks:
  - Connect to aggTrades and bookTicker
  - Heartbeat and resubscribe logic
  - Publish normalized events on `v1.market.*`
- Acceptance:
  - Events visible via a small subscriber script
  - Backpressure handling in place

### [MARKET-IO] Bar aggregator

- Path: `packages/market-io/src/barAggregator.ts`
- Tasks:
  - Build 1m bars from trades or bookTicker mid
  - Emit `v1.market.bars.{exch}.{symbol}.1m`
  - Persist to ClickHouse
- Acceptance:
  - Bars populate CH in near real time
  - Simple query returns expected counts

### [SIM] Golden replay scaffolding

- Path: `packages/sim/src/replay.ts`
- Tasks:
  - Define a session log format
  - Implement deterministic replay harness that reads a log and re-emits events
  - Add a proof test that round-trips a short session
- Acceptance:
  - Replay test passes and event hashes match

## Definition of done

- Type safe and validated modules
- Unit tests passing
- Services healthy via compose
- Basic ingestion to CH working
- Replay harness in place with a working spec

## Risks and mitigations

- Exchange disconnects - add auto resubscribe and jittered backoff
- Clock drift - include exchange timestamps and sync checks
- Schema churn - lock versioned JSON Schema early
