# Sprint 5 — UI: Strategy Builder & Live Dashboard

Duration: ~2 weeks

## Goal

Ship a usable UI to create strategies and monitor live trading.

## Deliverables

- Strategy Builder (form + JSON/YAML preview)
- Schema validation using shared JSON Schema
- Live Dashboard: positions, PnL, risk lights, trade tape, basic candle
- Gateway GraphQL/WS endpoints

## Tickets

### [UI] App shell & auth

Path: apps/ui/\*

- Vite + React + TS + Tailwind + shadcn
- RBAC hooks; token storage

### [UI] Strategy Builder

Path: apps/ui/src/pages/strategies/\*

- Form mapped to schema; validation errors
- YAML preview; Save & Deploy Shadow
- Import/export

### [GQL] Gateway schema & subs

Path: apps/gateway/src/graphql/\*

- Query: strategies, positions, pnl
- Mutation: saveStrategy, deployStrategy, haltTrading
- Subscriptions: telemetry, fills, riskStatus

### [UI] Live Dashboard

Path: apps/ui/src/pages/live/\*

- Positions table; PnL chart; risk status lights
- Trade tape with fills & actions
- Symbol selector

## DoD

- Create strategy in UI → saved in PG
- Deploy to shadow; live telemetry visible
- Basic candle + trades overlay working
