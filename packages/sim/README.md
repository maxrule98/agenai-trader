# @ai-quant/sim

**Deterministic simulation and replay engine for the AI-native quant trading platform.**

## Overview

This package provides capital-safe simulation and replay capabilities:

- **Deterministic Replay**: Seeded RNG for reproducible simulations
- **Event Sourcing**: Parse and re-emit events from session logs
- **Golden File Testing**: Compare replay runs for regression testing
- **Time Travel**: Step-by-step debugging for strategy development
- **Event Filtering**: Replay specific event types

## Installation

```bash
pnpm add @ai-quant/sim
```

## Usage

### Basic Replay

```typescript
import { ReplayEngine, parseSessionLog } from "@ai-quant/sim";

// Parse session log (JSONL format)
const jsonlLog = `
{"type":"bar","ts":1697529600000,"data":{...}}
{"type":"alpha_signal","ts":1697529660000,"data":{...}}
{"type":"action","ts":1697529661000,"data":{...}}
`;

const config = parseSessionLog(jsonlLog, "session-1", "seed-42");

// Create replay engine
const engine = new ReplayEngine(config);

// Register event handlers
engine.on("bar", (event) => {
	console.log("Bar received:", event.data);
});

engine.on("alpha_signal", (event) => {
	console.log("Signal received:", event.data);
});

// Run replay
await engine.run();
```

### Step-by-Step Execution

```typescript
const engine = new ReplayEngine(config);

// Process one event at a time
const event1 = await engine.step();
console.log("Event 1:", event1);

const event2 = await engine.step();
console.log("Event 2:", event2);

// Check progress
const progress = engine.getProgress();
console.log(`${progress.percent}% complete`);
```

### Deterministic RNG

```typescript
const engine = new ReplayEngine(config);

// Get deterministic random numbers
const rand1 = engine.random(); // 0.0 - 1.0
const rand2 = engine.random();

// Same seed always produces same sequence
```

### Golden File Testing

```typescript
import { compareReplays, serializeEvents } from '@ai-quant/sim';

// Record expected behavior
const expectedEvents = [...]; // Run strategy and capture events

// Save as golden file
const goldenFile = serializeEvents(expectedEvents);
fs.writeFileSync('test/golden/strategy-v1.jsonl', goldenFile);

// Later: compare against golden file
const actualEvents = [...]; // Run strategy again
const comparison = compareReplays(expectedEvents, actualEvents);

if (!comparison.equal) {
  console.error('Replay mismatch:', comparison.diffs);
  throw new Error('Strategy behavior changed');
}
```

### Event Filtering

```typescript
// Replay only specific event types
const config = {
	session: sessionMetadata,
	events: allEvents,
	filter: ["bar", "alpha_signal"], // Ignore actions, orders, etc.
};

const engine = new ReplayEngine(config);
await engine.run();
```

### Speed Control

```typescript
// Real-time replay
const config = {
	session: sessionMetadata,
	events: allEvents,
	speed: 1.0, // 1x real-time
};

// 10x speed
config.speed = 10.0;

// Instant (no delay)
config.speed = 0;
```

## Session Log Format

Session logs are JSONL (newline-delimited JSON) with the following structure:

```json
{"type":"bar","ts":1697529600000,"data":{...}}
{"type":"features","ts":1697529610000,"data":{...}}
{"type":"alpha_signal","ts":1697529620000,"data":{...}}
{"type":"action","ts":1697529625000,"data":{...}}
{"type":"risk_verdict","ts":1697529626000,"data":{...}}
```

Each line must have:

- `type`: Event type (bar, features, alpha_signal, action, risk_verdict, order, fill)
- `ts`: Unix timestamp in milliseconds
- `data`: Event-specific payload (validated by `@ai-quant/core` schemas)
- `meta`: (optional) Arbitrary metadata

## Scripts

- `pnpm build` - Compile TypeScript
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode

## Design Principles

1. **Deterministic**: Same seed always produces same results
2. **Chronological**: Events are always emitted in timestamp order
3. **Type-safe**: Event data validated by core schemas
4. **Capital-safe**: Golden file tests prevent regressions
5. **Debuggable**: Step-by-step execution and pause/resume

## Testing

Comprehensive tests cover:

- Deterministic RNG sequences
- Event emission and filtering
- Step-by-step execution
- Golden file comparisons
- JSONL parsing

Run tests:

```bash
pnpm test
```

## License

Proprietary - AI-Quant Platform
