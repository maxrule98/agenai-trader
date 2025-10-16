# Sprint 8 — Multi-Venue SOR, Correlation Heat Risk, L2 Simulator (Phase 2)

Duration: ~2–3 weeks

## Goal

Trade across multiple venues intelligently, add correlation-aware caps, and upgrade sim with a simple L2 queue model.

## Deliverables

- Bybit adapter; venue selection heuristics
- Correlation heat risk rule
- L2 simulator with naive queue position model
- UI controls for venue caps and correlation thresholds

## Tickets

### [EXEC] Bybit adapter

Path: packages/exec/src/bybit.ts

- Spot/Perp minimal parity with Binance adapter
- Funding/borrow awareness

### [SOR] Venue selection

Path: packages/exec/src/sor.ts

- Choose venue per order by spread, depth, fees, recent fill quality
- Fallback on outages

### [RISK] Correlation heat

Path: packages/plugins/src/risk/correlationHeat.ts

- Rolling correlation matrix of returns
- Cap same-direction aggregated exposure

### [SIM] L2 queue model

Path: packages/sim/src/l2Sim.ts

- Naive queue position estimation; partial fills
- Compare against OHLCV sim for consistency

### [UI] Venue & correlation controls

Path: apps/ui/src/pages/settings/venues.tsx

- Venue-level caps and weights
- Correlation limits editor

## DoD

- Orders routed to different venues based on SOR heuristics
- Correlation breaches block new risk
- L2 sim produces plausible fill distributions
