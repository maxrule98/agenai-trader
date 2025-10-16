# @ai-quant/core

**Core type system and data contracts for the AI-native quant trading platform.**

## Overview

This package defines the canonical data contracts used across all services and applications:

- **Market Data**: `Bar`, `L2Update`
- **Features**: `Features` (computed indicators and regime)
- **Alpha & Strategy**: `AlphaSignal`
- **Trading Actions**: `Action`, `Bracket`
- **Risk Management**: `RiskVerdict`

All types are validated with **Zod schemas** at system boundaries. TypeScript types are inferred from schemas for type safety.

## Installation

```bash
pnpm add @ai-quant/core
```

## Usage

### Importing Types and Schemas

```typescript
import {
	Bar,
	BarSchema,
	AlphaSignal,
	AlphaSignalSchema,
	Action,
	ActionSchema,
} from "@ai-quant/core";

// Validate incoming data
const bar: Bar = BarSchema.parse(untrustedData);

// Type-safe construction
const signal: AlphaSignal = {
	id: "sig-001",
	t: Date.now(),
	symbol: "BTCUSDT",
	exch: "BINANCE",
	tf: "5m",
	score: 0.8,
	conf: 0.9,
	horizon_sec: 300,
};
```

### JSON Schema for UI

The package exports a JSON Schema bundle at `@ai-quant/core/schema.json` for use in UI validation and form generation:

```typescript
import schemaBundle from "@ai-quant/core/schema.json";

console.log(schemaBundle.schemas.AlphaSignal);
```

## Scripts

- `pnpm build` - Compile TypeScript and generate JSON Schema
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode

## Design Principles

1. **Zod-first**: All boundaries validate with Zod before processing.
2. **Strict schemas**: No extraneous properties allowed (`.strict()`).
3. **Capital-safe**: Types enforce valid ranges (e.g., AlphaSignal score ∈ [-1, 1]).
4. **Deterministic**: Timestamps are Unix ms; no ambiguity in timezones or precision.
5. **Extensible metadata**: `Action.metadata` allows strategy-specific context.

## Testing

All schemas have comprehensive unit tests covering:

- Valid inputs
- Boundary conditions
- Invalid inputs and rejections

Run tests:

```bash
pnpm test
```

## License

Proprietary - AI-Quant Platform
