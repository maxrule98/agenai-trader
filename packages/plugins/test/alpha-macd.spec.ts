import { describe, it, expect, beforeEach } from "vitest";
import { Features } from "@ai-quant/core";
import { MACDAlpha, MACDConfigSchema } from "../src/alpha/macd.js";

describe("@ai-quant/plugins MACD alpha", () => {
	// Helper to create mock features
	const createMockFeatures = (
		macd: number,
		signal: number,
		histogram: number,
		t = Date.now()
	): Features => ({
		t,
		exch: "BINANCE",
		symbol: "BTCUSDT",
		tf: "1m",
		vals: {
			macd,
			macd_signal: signal,
			macd_histogram: histogram,
			close: 100,
		},
		regime: "ranging",
	});

	describe("MACDAlpha", () => {
		let alpha: MACDAlpha;

		beforeEach(() => {
			alpha = new MACDAlpha();
		});

		it("initializes with default config", () => {
			expect(alpha).toBeDefined();
			expect(alpha.getState().prevMacd).toBeNull();
		});

		it("accepts custom config", () => {
			const customAlpha = new MACDAlpha(
				MACDConfigSchema.parse({ minHistogram: 0.001, useCrossover: false })
			);
			expect(customAlpha).toBeDefined();
		});

		it("returns null for missing MACD values", () => {
			const features: Features = {
				t: Date.now(),
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1m",
				vals: { close: 100 },
				regime: "ranging",
			};

			const signal = alpha.generateSignal(features);
			expect(signal).toBeNull();
		});

		it("returns null for NaN MACD values", () => {
			const features = createMockFeatures(NaN, NaN, NaN);
			const signal = alpha.generateSignal(features);
			expect(signal).toBeNull();
		});

		it("returns null for histogram below threshold", () => {
			const features = createMockFeatures(0.001, 0.0009, 0.00001);
			const signal = alpha.generateSignal(features);
			expect(signal).toBeNull();
		});

		it("generates signal from positive histogram", () => {
			const features = createMockFeatures(0.01, 0.005, 0.005);
			const signal = alpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				expect(signal.score).toBeGreaterThan(0); // Bullish
				expect(signal.conf).toBeGreaterThan(0);
				expect(signal.symbol).toBe("BTCUSDT");
				expect(signal.explain).toContain("positive");
			}
		});

		it("generates signal from negative histogram", () => {
			const features = createMockFeatures(-0.01, -0.005, -0.005);
			const signal = alpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				expect(signal.score).toBeLessThan(0); // Bearish
				expect(signal.conf).toBeGreaterThan(0);
				expect(signal.explain).toContain("negative");
			}
		});

		it("detects bullish crossover", () => {
			// Setup: MACD below signal
			alpha.generateSignal(createMockFeatures(-0.01, 0.0, -0.01, Date.now()));

			// Crossover: MACD crosses above signal
			const features = createMockFeatures(0.01, 0.0, 0.01, Date.now() + 1000);
			const signal = alpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				expect(signal.score).toBe(1);
				expect(signal.conf).toBe(0.8);
				expect(signal.explain).toContain("bullish crossover");
			}
		});

		it("detects bearish crossover", () => {
			// Setup: MACD above signal
			alpha.generateSignal(createMockFeatures(0.01, 0.0, 0.01, Date.now()));

			// Crossover: MACD crosses below signal
			const features = createMockFeatures(-0.01, 0.0, -0.01, Date.now() + 1000);
			const signal = alpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				expect(signal.score).toBe(-1);
				expect(signal.conf).toBe(0.8);
				expect(signal.explain).toContain("bearish crossover");
			}
		});

		it("detects strengthening momentum", () => {
			// First update
			alpha.generateSignal(createMockFeatures(0.005, 0.003, 0.002, Date.now()));

			// Increasing histogram (strengthening)
			const features = createMockFeatures(
				0.008,
				0.003,
				0.005,
				Date.now() + 1000
			);
			const signal = alpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				expect(signal.conf).toBeGreaterThan(0.5); // Strengthening
				expect(signal.explain).toContain("strengthening");
			}
		});

		it("detects weakening momentum", () => {
			// First update: large histogram
			alpha.generateSignal(createMockFeatures(0.01, 0.005, 0.005, Date.now()));

			// Decreasing histogram (weakening)
			const features = createMockFeatures(
				0.006,
				0.004,
				0.002,
				Date.now() + 1000
			);
			const signal = alpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				expect(signal.conf).toBeLessThan(0.5); // Weakening
				expect(signal.explain).toContain("weakening");
			}
		});

		it("works in histogram-only mode", () => {
			const histogramOnlyAlpha = new MACDAlpha(
				MACDConfigSchema.parse({ useCrossover: false })
			);

			// Setup state
			histogramOnlyAlpha.generateSignal(
				createMockFeatures(-0.01, 0.0, -0.01, Date.now())
			);

			// Even with crossover conditions, should use histogram
			const features = createMockFeatures(0.01, 0.0, 0.01, Date.now() + 1000);
			const signal = histogramOnlyAlpha.generateSignal(features);

			expect(signal).not.toBeNull();
			if (signal) {
				// Should not be crossover signal (score = 1)
				expect(signal.explain).not.toContain("crossover");
			}
		});

		it("resets state correctly", () => {
			alpha.generateSignal(createMockFeatures(0.01, 0.005, 0.005, Date.now()));
			expect(alpha.getState().prevMacd).not.toBeNull();

			alpha.reset();
			expect(alpha.getState().prevMacd).toBeNull();
			expect(alpha.getState().prevSignal).toBeNull();
			expect(alpha.getState().prevHistogram).toBeNull();
		});

		it("validates signal output with Zod", () => {
			const features = createMockFeatures(0.01, 0.005, 0.005);
			const signal = alpha.generateSignal(features);

			if (signal) {
				expect(signal.score).toBeGreaterThanOrEqual(-1);
				expect(signal.score).toBeLessThanOrEqual(1);
				expect(signal.conf).toBeGreaterThanOrEqual(0);
				expect(signal.conf).toBeLessThanOrEqual(1);
				expect(signal.id).toContain("macd");
			}
		});

		it("updates state after each signal", () => {
			const features1 = createMockFeatures(0.005, 0.003, 0.002, Date.now());
			alpha.generateSignal(features1);

			const state1 = alpha.getState();
			expect(state1.prevMacd).toBe(0.005);
			expect(state1.prevSignal).toBe(0.003);
			expect(state1.prevHistogram).toBe(0.002);

			const features2 = createMockFeatures(
				0.008,
				0.004,
				0.004,
				Date.now() + 1000
			);
			alpha.generateSignal(features2);

			const state2 = alpha.getState();
			expect(state2.prevMacd).toBe(0.008);
			expect(state2.prevSignal).toBe(0.004);
			expect(state2.prevHistogram).toBe(0.004);
		});

		it("produces deterministic signals for same input sequence", () => {
			const alpha1 = new MACDAlpha();
			const alpha2 = new MACDAlpha();

			const sequence = [
				createMockFeatures(0.001, 0.0005, 0.0005, 1000),
				createMockFeatures(0.002, 0.001, 0.001, 2000),
				createMockFeatures(-0.001, 0.0, -0.001, 3000),
			];

			for (const features of sequence) {
				alpha1.generateSignal(features);
				alpha2.generateSignal(features);
			}

			expect(alpha1.getState()).toEqual(alpha2.getState());
		});
	});

	describe("MACDConfigSchema validation", () => {
		it("accepts valid config", () => {
			const config = MACDConfigSchema.parse({
				minHistogram: 0.0001,
				horizonSec: 300,
				useCrossover: true,
			});

			expect(config.minHistogram).toBe(0.0001);
		});

		it("applies defaults", () => {
			const config = MACDConfigSchema.parse({});

			expect(config.minHistogram).toBe(0.0001);
			expect(config.horizonSec).toBe(300);
			expect(config.useCrossover).toBe(true);
		});

		it("rejects invalid config", () => {
			expect(() => MACDConfigSchema.parse({ minHistogram: -1 })).toThrow();
			expect(() => MACDConfigSchema.parse({ horizonSec: 0 })).toThrow();
		});

		it("rejects extraneous properties", () => {
			expect(() =>
				MACDConfigSchema.parse({ minHistogram: 0.0001, extra: "bad" })
			).toThrow();
		});
	});
});
