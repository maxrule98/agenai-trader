# @ai-quant/features

**Feature engineering and rolling indicators for the AI-native quant platform.**

## Overview

Provides:

- **Rolling Indicators**: SMA, EMA, WMA, variance, stddev, ATR, RSI, MACD
- **Feature Factory**: Build validated Features from Bars
- **Returns Computation**: Simple and log returns
- **Z-score Normalization**: With Redis cache support
- **Regime Classification**: trending_up, trending_down, ranging, volatile

## Installation

```bash
pnpm add @ai-quant/features
```

## Usage

### Rolling Indicators

```typescript
import { sma, ema, rsi, atr, macd } from "@ai-quant/features";

const closes = [100, 101, 102, 103, 104];

const sma5 = sma(closes, 5);
const rsi14 = rsi(closes, 14);
const macdResult = macd(closes);

console.log({ sma5, rsi14, macd: macdResult.macd });
```

### Feature Factory

```typescript
import { buildFeaturesSync } from '@ai-quant/features';
import { Bar } from '@ai-quant/core';

const bars: Bar[] = [...]; // 30+ bars

const features = buildFeaturesSync(bars);
console.log(features.vals.rsi_14, features.regime);
```

## Determinism

All functions are pure and deterministic. Same inputs always produce same outputs.

## License

Proprietary - AI-Quant Platform
