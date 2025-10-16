# @ai-quant/plugins

**Alpha and policy plugins for the AI-native quant platform.**

## Overview

Provides baseline alpha strategies and policy engines:

**Alpha Plugins**:

- **AR(4)**: Autoregressive model for mean-reversion
- **MACD**: Moving average convergence/divergence momentum

**Policy Plugins**:

- **Threshold-ATR**: Converts signals to actions with hysteresis and ATR-based brackets

## Installation

```bash
pnpm add @ai-quant/plugins
```

## Usage

### AR(4) Alpha

```typescript
import { AR4Alpha } from '@ai-quant/plugins';
import { Features } from '@ai-quant/core';

const alpha = new AR4Alpha({ fitWindow: 100, minRSquared: 0.1 });

const features: Features = {...};
const signal = alpha.generateSignal(features);

if (signal) {
  console.log(`Score: ${signal.score}, Confidence: ${signal.conf}`);
}
```

### MACD Alpha

```typescript
import { MACDAlpha } from "@ai-quant/plugins";

const alpha = new MACDAlpha({ useCrossover: true });

const signal = alpha.generateSignal(features);
```

### Threshold-ATR Policy

```typescript
import { ThresholdAtrPolicy } from "@ai-quant/plugins";

const policy = new ThresholdAtrPolicy({
	enterThreshold: 0.6,
	exitThreshold: 0.4,
	atrTpMultiplier: 2.0,
	atrSlMultiplier: 1.0,
});

const action = policy.generateAction(signal, features);

if (action) {
	console.log(`${action.side} ${action.size} with TP/SL`);
}
```

## Capital-Safe Design

- Strict Zod validation at all boundaries
- Hysteresis prevents flip-flopping
- ATR-based risk management
- Position size limits enforced

## License

Proprietary - AI-Quant Platform
