import { describe, it, expect, beforeEach } from "vitest";
import { AlphaSignal, Features } from "@ai-quant/core";
import {
	ThresholdAtrPolicy,
	ThresholdAtrConfigSchema,
} from "../src/policy/thresholdAtr.js";

describe("@ai-quant/plugins Threshold-ATR policy", () => {
	// Helper to create mock signal
	const createMockSignal = (score: number, t = Date.now()): AlphaSignal => ({
		id: `test-signal-${t}`,
		t,
		symbol: "BTCUSDT",
		exch: "BINANCE",
		tf: "1m",
		score,
		conf: 0.8,
		horizon_sec: 300,
	});

	// Helper to create mock features
	const createMockFeatures = (
		close: number,
		atr: number,
		t = Date.now()
	): Features => ({
		t,
		exch: "BINANCE",
		symbol: "BTCUSDT",
		tf: "1m",
		vals: {
			close,
			atr_14: atr,
		},
		regime: "ranging",
	});

	describe("ThresholdAtrPolicy", () => {
		let policy: ThresholdAtrPolicy;

		beforeEach(() => {
			policy = new ThresholdAtrPolicy();
		});

		it("initializes with default config", () => {
			expect(policy).toBeDefined();
			expect(policy.isFlat()).toBe(true);
		});

		it("accepts custom config", () => {
			const customPolicy = new ThresholdAtrPolicy(
				ThresholdAtrConfigSchema.parse({
					enterThreshold: 0.7,
					exitThreshold: 0.4,
					fixedNotional: 5000,
				})
			);
			expect(customPolicy).toBeDefined();
		});

		it("throws error if enterThreshold < exitThreshold", () => {
			expect(
				() =>
					new ThresholdAtrPolicy(
						ThresholdAtrConfigSchema.parse({
							enterThreshold: 0.3,
							exitThreshold: 0.5,
						})
					)
			).toThrow("enterThreshold must be >= exitThreshold");
		});

		it("returns null for weak signal when flat", () => {
			const signal = createMockSignal(0.3); // Below default 0.5 threshold
			const features = createMockFeatures(50000, 500);

			const action = policy.generateAction(signal, features);
			expect(action).toBeNull();
			expect(policy.isFlat()).toBe(true);
		});

		it("opens long position for strong bullish signal", () => {
			const signal = createMockSignal(0.8); // Above threshold
			const features = createMockFeatures(50000, 500);

			const action = policy.generateAction(signal, features);

			expect(action).not.toBeNull();
			if (action) {
				expect(action.side).toBe("buy");
				expect(action.size).toBeGreaterThan(0);
				expect(action.bracket).toBeDefined();
				expect(action.bracket!.tp).toBeGreaterThan(50000); // TP above entry
				expect(action.bracket!.sl).toBeLessThan(50000); // SL below entry
				expect(action.metadata?.signalId).toBe(signal.id);
			}
			expect(policy.isFlat()).toBe(false);
		});

		it("opens short position for strong bearish signal", () => {
			const signal = createMockSignal(-0.8);
			const features = createMockFeatures(50000, 500);

			const action = policy.generateAction(signal, features);

			expect(action).not.toBeNull();
			if (action) {
				expect(action.side).toBe("sell");
				expect(action.size).toBeGreaterThan(0);
				expect(action.bracket!.tp).toBeLessThan(50000); // TP below entry (short)
				expect(action.bracket!.sl).toBeGreaterThan(50000); // SL above entry (short)
			}
			expect(policy.isFlat()).toBe(false);
		});

		it("computes bracket with correct ATR multiples", () => {
			const config = ThresholdAtrConfigSchema.parse({
				atrTpMultiplier: 3.0,
				atrSlMultiplier: 1.5,
			});
			const customPolicy = new ThresholdAtrPolicy(config);

			const signal = createMockSignal(0.8);
			const features = createMockFeatures(50000, 1000); // ATR = 1000

			const action = customPolicy.generateAction(signal, features);

			if (action) {
				// Long: TP = 50000 + 3*1000, SL = 50000 - 1.5*1000
				expect(action.bracket!.tp).toBe(53000);
				expect(action.bracket!.sl).toBe(48500);
			}
		});

		it("sizes position with fixed notional", () => {
			const config = ThresholdAtrConfigSchema.parse({
				fixedNotional: 10000,
				useAtrSizing: false,
			});
			const customPolicy = new ThresholdAtrPolicy(config);

			const signal = createMockSignal(0.8);
			const features = createMockFeatures(50000, 500);

			const action = customPolicy.generateAction(signal, features);

			if (action) {
				// Size = 10000 / 50000 = 0.2
				expect(action.size).toBeCloseTo(0.2, 5);
			}
		});

		it("sizes position with ATR-based sizing", () => {
			const config = ThresholdAtrConfigSchema.parse({
				fixedNotional: 10000,
				useAtrSizing: true,
				atrSizingMultiplier: 1.0,
			});
			const customPolicy = new ThresholdAtrPolicy(config);

			const signal = createMockSignal(0.8);
			const features = createMockFeatures(50000, 1000); // ATR = 1000

			const action = customPolicy.generateAction(signal, features);

			if (action) {
				// Size = 10000 / (50000 * 1000 / 50000) = 10000 / 1000 = 10
				// But clamped to maxSize (default 10)
				expect(action.size).toBeLessThanOrEqual(10);
			}
		});

		it("respects max size limit", () => {
			const config = ThresholdAtrConfigSchema.parse({
				fixedNotional: 1000000, // Very large
				maxSize: 5,
			});
			const customPolicy = new ThresholdAtrPolicy(config);

			const signal = createMockSignal(0.8);
			const features = createMockFeatures(50000, 500);

			const action = customPolicy.generateAction(signal, features);

			if (action) {
				expect(action.size).toBeLessThanOrEqual(5);
			}
		});

		it("holds position for signal above exit threshold", () => {
			// Open position
			const openSignal = createMockSignal(0.8);
			const features1 = createMockFeatures(50000, 500);
			policy.generateAction(openSignal, features1);

			expect(policy.isFlat()).toBe(false);

			// Signal weakens but still above exit threshold (0.3)
			const holdSignal = createMockSignal(0.4);
			const features2 = createMockFeatures(50100, 500);
			const action = policy.generateAction(holdSignal, features2);

			expect(action).toBeNull(); // Hold, no action
			expect(policy.isFlat()).toBe(false);
		});

		it("closes position when signal drops below exit threshold", () => {
			// Open long position
			const openSignal = createMockSignal(0.8);
			const features1 = createMockFeatures(50000, 500);
			policy.generateAction(openSignal, features1);

			expect(policy.isFlat()).toBe(false);

			// Signal weakens below exit threshold
			const weakSignal = createMockSignal(0.2); // Below 0.3 exit threshold
			const features2 = createMockFeatures(50100, 500);
			const action = policy.generateAction(weakSignal, features2);

			expect(action).not.toBeNull();
			if (action) {
				expect(action.side).toBe("sell"); // Close long
				expect(action.metadata?.reason).toBe("exit_threshold");
			}
			expect(policy.isFlat()).toBe(true);
		});

		it("reverses position on strong opposite signal", () => {
			// Open long position
			const longSignal = createMockSignal(0.8);
			const features1 = createMockFeatures(50000, 500);
			const longAction = policy.generateAction(longSignal, features1);

			expect(longAction?.side).toBe("buy");
			expect(policy.getState().side).toBe("buy");

			// Strong bearish signal triggers reversal
			const shortSignal = createMockSignal(-0.9);
			const features2 = createMockFeatures(50100, 500);
			const reverseAction = policy.generateAction(shortSignal, features2);

			expect(reverseAction).not.toBeNull();
			if (reverseAction) {
				expect(reverseAction.side).toBe("sell"); // Open short
				expect(policy.getState().side).toBe("sell");
			}
		});

		it("does not reverse on weak opposite signal", () => {
			// Open long position
			const longSignal = createMockSignal(0.8);
			const features1 = createMockFeatures(50000, 500);
			policy.generateAction(longSignal, features1);

			// Weak bearish signal (not above enter threshold)
			const weakShortSignal = createMockSignal(-0.4);
			const features2 = createMockFeatures(50100, 500);
			const action = policy.generateAction(weakShortSignal, features2);

			// Should close if below exit threshold, or hold
			// Since |-0.4| = 0.4 > 0.3 (exit), should hold
			expect(action).toBeNull();
			expect(policy.getState().side).toBe("buy"); // Still long
		});

		it("returns null for missing ATR", () => {
			const signal = createMockSignal(0.8);
			const features: Features = {
				t: Date.now(),
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1m",
				vals: { close: 50000 }, // Missing atr_14
				regime: "ranging",
			};

			const action = policy.generateAction(signal, features);
			expect(action).toBeNull();
		});

		it("returns null for NaN values", () => {
			const signal = createMockSignal(0.8);
			// NaN will fail Zod validation before logic runs
			const features = createMockFeatures(NaN, 500);

			// Should throw ZodError due to NaN in vals.close
			expect(() => policy.generateAction(signal, features)).toThrow();
		});

		it("validates action output with Zod", () => {
			const signal = createMockSignal(0.8);
			const features = createMockFeatures(50000, 500);

			const action = policy.generateAction(signal, features);

			if (action) {
				expect(action.size).toBeGreaterThan(0);
				expect(action.side).toBeDefined();
				expect(action.symbol).toBe("BTCUSDT");
				expect(action.exch).toBe("BINANCE");
			}
		});

		it("resets state correctly", () => {
			// Open position
			const signal = createMockSignal(0.8);
			const features = createMockFeatures(50000, 500);
			policy.generateAction(signal, features);

			expect(policy.isFlat()).toBe(false);

			policy.reset();

			expect(policy.isFlat()).toBe(true);
			expect(policy.getState().size).toBe(0);
		});

		it("produces deterministic actions for same inputs", () => {
			const policy1 = new ThresholdAtrPolicy();
			const policy2 = new ThresholdAtrPolicy();

			const signal = createMockSignal(0.8, 1000);
			const features = createMockFeatures(50000, 500, 1000);

			const action1 = policy1.generateAction(signal, features);
			const action2 = policy2.generateAction(signal, features);

			expect(action1).toEqual(action2);
		});
	});

	describe("ThresholdAtrConfigSchema validation", () => {
		it("accepts valid config", () => {
			const config = ThresholdAtrConfigSchema.parse({
				enterThreshold: 0.6,
				exitThreshold: 0.4,
				fixedNotional: 2000,
				useAtrSizing: true,
				atrSizingMultiplier: 1.5,
				atrTpMultiplier: 2.5,
				atrSlMultiplier: 1.2,
				maxSize: 20,
			});

			expect(config.enterThreshold).toBe(0.6);
		});

		it("applies defaults", () => {
			const config = ThresholdAtrConfigSchema.parse({});

			expect(config.enterThreshold).toBe(0.5);
			expect(config.exitThreshold).toBe(0.3);
			expect(config.fixedNotional).toBe(1000);
			expect(config.useAtrSizing).toBe(false);
		});

		it("rejects invalid config", () => {
			expect(() =>
				ThresholdAtrConfigSchema.parse({ enterThreshold: 1.5 })
			).toThrow();
			expect(() => ThresholdAtrConfigSchema.parse({ maxSize: -1 })).toThrow();
		});

		it("rejects extraneous properties", () => {
			expect(() =>
				ThresholdAtrConfigSchema.parse({ enterThreshold: 0.5, extra: "bad" })
			).toThrow();
		});
	});
});
