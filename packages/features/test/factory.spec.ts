import { describe, it, expect } from "vitest";
import { Bar } from "@ai-quant/core";
import {
	buildFeaturesSync,
	buildFeatures,
	computeReturns,
	zScore,
	volatilityBucket,
	computeTrendStrength,
	classifyRegime,
	Regime,
	FeatureConfigSchema,
	StubNormalizationCache,
} from "../src/factory.js";

describe("@ai-quant/features factory", () => {
	// Helper to create mock bars
	const createMockBars = (count: number, startPrice = 100): Bar[] => {
		const bars: Bar[] = [];
		for (let i = 0; i < count; i++) {
			const t = 1697529600000 + i * 60000; // 1 minute apart
			const c = startPrice + i * 0.5; // Slight uptrend
			bars.push({
				t,
				o: c - 0.2,
				h: c + 0.3,
				l: c - 0.3,
				c,
				v: 100 + i,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1m",
			});
		}
		return bars;
	};

	describe("computeReturns", () => {
		it("computes simple and log returns", () => {
			const bars = createMockBars(5);
			const returns = computeReturns(bars);

			expect(returns.simpleReturn).not.toBeNaN();
			expect(returns.logReturn).not.toBeNaN();
			expect(returns.simpleReturn).toBeCloseTo(0.005, 3); // ~0.5% for 0.5 move on 100
		});

		it("returns NaN for insufficient data", () => {
			const bars = createMockBars(1);
			const returns = computeReturns(bars);

			expect(returns.simpleReturn).toBeNaN();
			expect(returns.logReturn).toBeNaN();
		});
	});

	describe("zScore", () => {
		it("computes z-score correctly", () => {
			expect(zScore(110, 100, 10)).toBe(1);
			expect(zScore(90, 100, 10)).toBe(-1);
			expect(zScore(100, 100, 10)).toBe(0);
		});

		it("returns NaN for zero stddev", () => {
			expect(zScore(100, 100, 0)).toBeNaN();
		});
	});

	describe("volatilityBucket", () => {
		it("classifies low volatility", () => {
			const result = volatilityBucket(0.005, { low: 0.01, high: 0.03 });
			expect(result).toBe("low");
		});

		it("classifies medium volatility", () => {
			const result = volatilityBucket(0.02, { low: 0.01, high: 0.03 });
			expect(result).toBe("medium");
		});

		it("classifies high volatility", () => {
			const result = volatilityBucket(0.05, { low: 0.01, high: 0.03 });
			expect(result).toBe("high");
		});
	});

	describe("classifyRegime", () => {
		it("classifies volatile regime", () => {
			const regime = classifyRegime(0.5, 3.0);
			expect(regime).toBe(Regime.VOLATILE);
		});

		it("classifies trending up regime", () => {
			const regime = classifyRegime(0.8, 1.0);
			expect(regime).toBe(Regime.TRENDING_UP);
		});

		it("classifies trending down regime", () => {
			const regime = classifyRegime(-0.8, 1.0);
			expect(regime).toBe(Regime.TRENDING_DOWN);
		});

		it("classifies ranging regime", () => {
			const regime = classifyRegime(0.2, 1.0);
			expect(regime).toBe(Regime.RANGING);
		});
	});

	describe("computeTrendStrength", () => {
		it("computes trend strength for uptrend", () => {
			const bars = createMockBars(30, 100); // Uptrend
			const config = FeatureConfigSchema.parse({});
			const strength = computeTrendStrength(bars, config);

			expect(strength).not.toBeNaN();
			expect(strength).toBeGreaterThan(0); // Positive for uptrend
			expect(strength).toBeLessThanOrEqual(1);
		});

		it("computes trend strength for downtrend", () => {
			const bars: Bar[] = [];
			for (let i = 0; i < 30; i++) {
				const t = 1697529600000 + i * 60000;
				const c = 150 - i * 0.5; // Downtrend
				bars.push({
					t,
					o: c + 0.2,
					h: c + 0.3,
					l: c - 0.3,
					c,
					v: 100 + i,
					exch: "BINANCE",
					symbol: "BTCUSDT",
					tf: "1m",
				});
			}

			const config = FeatureConfigSchema.parse({});
			const strength = computeTrendStrength(bars, config);

			expect(strength).not.toBeNaN();
			expect(strength).toBeLessThan(0); // Negative for downtrend
			expect(strength).toBeGreaterThanOrEqual(-1);
		});

		it("returns NaN for insufficient data", () => {
			const bars = createMockBars(5);
			const config = FeatureConfigSchema.parse({});
			const strength = computeTrendStrength(bars, config);

			expect(strength).toBeNaN();
		});
	});

	describe("buildFeaturesSync", () => {
		it("builds features from bars", () => {
			const bars = createMockBars(50); // Enough for MACD (slow=26, signal=9)
			const features = buildFeaturesSync(bars);

			expect(features.t).toBe(bars[bars.length - 1]!.t);
			expect(features.exch).toBe("BINANCE");
			expect(features.symbol).toBe("BTCUSDT");
			expect(features.tf).toBe("1m");
			expect(features.regime).toBeDefined();

			// Check feature values
			expect(features.vals.close).toBeCloseTo(124.5, 1);
			expect(features.vals.sma_20).not.toBeNaN();
			expect(features.vals.ema_12).not.toBeNaN();
			expect(features.vals.rsi_14).not.toBeNaN();
			expect(features.vals.atr_14).not.toBeNaN();
			expect(features.vals.macd).not.toBeNaN();
			expect(features.vals.trend_strength).not.toBeNaN();
		});

		it("validates features with Zod", () => {
			const bars = createMockBars(50);
			const features = buildFeaturesSync(bars);

			// Should not throw (validated internally)
			expect(features).toBeDefined();
			expect(typeof features.vals).toBe("object");
		});

		it("throws for insufficient data", () => {
			const bars = createMockBars(10); // Less than default window of 20

			expect(() => buildFeaturesSync(bars)).toThrow("Insufficient data");
		});

		it("accepts custom config", () => {
			const bars = createMockBars(50);
			const config = FeatureConfigSchema.parse({ window: 15, rsiPeriod: 10 });
			const features = buildFeaturesSync(bars, config);

			expect(features).toBeDefined();
			expect(features.vals.rsi_14).not.toBeNaN(); // Still computed with default name
		});
	});

	describe("buildFeatures (async with cache)", () => {
		it("builds features using cache", async () => {
			const bars = createMockBars(50);
			const cache = new StubNormalizationCache();
			const features = await buildFeatures(bars, undefined, cache);

			expect(features.t).toBe(bars[bars.length - 1]!.t);
			expect(features.vals.z_score_close).not.toBeNaN();
		});

		it("handles cache miss gracefully", async () => {
			const bars = createMockBars(50);
			const cache = new StubNormalizationCache();

			// Cache always returns null (miss)
			const features = await buildFeatures(bars, undefined, cache);

			expect(features).toBeDefined();
			expect(features.vals.z_score_close).not.toBeNaN();
		});

		it("throws for invalid bars", async () => {
			const invalidBars = [
				{
					t: 1697529600000,
					o: -100, // Invalid: negative price
					h: 101,
					l: 99,
					c: 100,
					v: 100,
					exch: "BINANCE",
					symbol: "BTCUSDT",
					tf: "1m",
				},
			];

			await expect(buildFeatures(invalidBars as any)).rejects.toThrow();
		});
	});

	describe("FeatureConfigSchema validation", () => {
		it("accepts valid config", () => {
			const config = FeatureConfigSchema.parse({
				window: 20,
				rsiPeriod: 14,
				atrPeriod: 14,
				macdFast: 12,
				macdSlow: 26,
				macdSignal: 9,
				volBuckets: {
					low: 0.01,
					high: 0.03,
				},
			});

			expect(config.window).toBe(20);
		});

		it("applies defaults", () => {
			const config = FeatureConfigSchema.parse({});

			expect(config.window).toBe(20);
			expect(config.rsiPeriod).toBe(14);
			expect(config.atrPeriod).toBe(14);
		});

		it("rejects invalid config", () => {
			expect(() => FeatureConfigSchema.parse({ window: -1 })).toThrow();

			expect(() => FeatureConfigSchema.parse({ window: "invalid" })).toThrow();
		});

		it("rejects extraneous properties", () => {
			expect(() =>
				FeatureConfigSchema.parse({ window: 20, extra: "bad" })
			).toThrow();
		});
	});

	describe("determinism", () => {
		it("produces identical features for same input", () => {
			const bars = createMockBars(50);

			const features1 = buildFeaturesSync(bars);
			const features2 = buildFeaturesSync(bars);

			expect(features1).toEqual(features2);
		});
	});
});
