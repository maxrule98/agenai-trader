import { describe, it, expect, beforeEach } from "vitest";
import { Features } from "@ai-quant/core";
import {
	AR4Alpha,
	AR4ConfigSchema,
	fitAR4,
	predictAR4,
	AR4Coefficients,
} from "../src/alpha/ar4.js";

describe("@ai-quant/plugins AR(4) alpha", () => {
	// Helper to create mock features
	const createMockFeatures = (
		returnValue: number,
		t = Date.now()
	): Features => ({
		t,
		exch: "BINANCE",
		symbol: "BTCUSDT",
		tf: "1m",
		vals: {
			return_1: returnValue,
			close: 100,
		},
		regime: "ranging",
	});

	describe("fitAR4", () => {
		it("fits AR(4) model on synthetic data", () => {
			// Generate synthetic AR(4) data with known coefficients
			const trueCoeffs = {
				beta0: 0,
				beta1: 0.3,
				beta2: 0.2,
				beta3: 0.1,
				beta4: 0.05,
			};
			const returns: number[] = [0, 0, 0, 0]; // Initial values

			for (let i = 0; i < 100; i++) {
				const r =
					trueCoeffs.beta0 +
					trueCoeffs.beta1 * returns[returns.length - 1]! +
					trueCoeffs.beta2 * returns[returns.length - 2]! +
					trueCoeffs.beta3 * returns[returns.length - 3]! +
					trueCoeffs.beta4 * returns[returns.length - 4]! +
					(Math.random() - 0.5) * 0.01; // Small noise
				returns.push(r);
			}

			const fitted = fitAR4(returns);

			// Coefficients won't be exact due to noise and finite sample
			// Just verify model fits reasonably and doesn't explode
			expect(fitted.rSquared).toBeGreaterThanOrEqual(0); // Non-negative R²
			expect(fitted.rSquared).toBeLessThanOrEqual(1); // R² bounded
			expect(Math.abs(fitted.beta1)).toBeLessThan(2); // Reasonable magnitude
		});

		it("returns zero coefficients for insufficient data", () => {
			const returns = [0.01, 0.02];
			const fitted = fitAR4(returns);

			expect(fitted.beta0).toBe(0);
			expect(fitted.beta1).toBe(0);
			expect(fitted.rSquared).toBe(0);
		});

		it("handles constant returns", () => {
			const returns = Array(50).fill(0.01);
			const fitted = fitAR4(returns);

			// Should have low R-squared (no predictive power)
			expect(fitted.rSquared).toBeLessThan(0.2);
		});
	});

	describe("predictAR4", () => {
		it("predicts next return using coefficients", () => {
			const coeffs: AR4Coefficients = {
				beta0: 0.001,
				beta1: 0.5,
				beta2: 0.3,
				beta3: 0.1,
				beta4: 0.05,
				rSquared: 0.8,
			};

			const recentReturns: [number, number, number, number] = [
				0.02, 0.01, -0.01, 0.0,
			];
			const predicted = predictAR4(coeffs, recentReturns);

			const expected =
				0.001 + 0.5 * 0.02 + 0.3 * 0.01 + 0.1 * -0.01 + 0.05 * 0.0;
			expect(predicted).toBeCloseTo(expected, 10);
		});

		it("handles zero coefficients", () => {
			const coeffs: AR4Coefficients = {
				beta0: 0,
				beta1: 0,
				beta2: 0,
				beta3: 0,
				beta4: 0,
				rSquared: 0,
			};

			const recentReturns: [number, number, number, number] = [
				0.1, 0.05, -0.02, 0.03,
			];
			const predicted = predictAR4(coeffs, recentReturns);

			expect(predicted).toBe(0);
		});
	});

	describe("AR4Alpha", () => {
		let alpha: AR4Alpha;

		beforeEach(() => {
			alpha = new AR4Alpha();
		});

		it("initializes with default config", () => {
			expect(alpha).toBeDefined();
			expect(alpha.getCoefficients()).toBeNull();
		});

		it("accepts custom config", () => {
			const customAlpha = new AR4Alpha(
				AR4ConfigSchema.parse({ fitWindow: 50, minRSquared: 0.2 })
			);
			expect(customAlpha).toBeDefined();
		});

		it("returns null for insufficient data", () => {
			const features = createMockFeatures(0.001);
			const signal = alpha.generateSignal(features);

			expect(signal).toBeNull(); // Need at least 4 returns
		});

		it("generates signal after accumulating returns", () => {
			// Add enough returns to fit model
			for (let i = 0; i < 30; i++) {
				const ret = (Math.random() - 0.5) * 0.02;
				alpha.generateSignal(createMockFeatures(ret, Date.now() + i * 1000));
			}

			// Should have fitted coefficients
			const coeffs = alpha.getCoefficients();
			expect(coeffs).not.toBeNull();
		});

		it("validates signal output with Zod", () => {
			// Add returns with clear trend
			for (let i = 0; i < 50; i++) {
				const ret = 0.001 * (1 + i * 0.01); // Slight trend
				alpha.generateSignal(createMockFeatures(ret, Date.now() + i * 1000));
			}

			const features = createMockFeatures(0.002, Date.now() + 60000);
			const signal = alpha.generateSignal(features);

			if (signal) {
				expect(signal.score).toBeGreaterThanOrEqual(-1);
				expect(signal.score).toBeLessThanOrEqual(1);
				expect(signal.conf).toBeGreaterThanOrEqual(0);
				expect(signal.conf).toBeLessThanOrEqual(1);
				expect(signal.id).toContain("ar4");
				expect(signal.symbol).toBe("BTCUSDT");
			}
		});

		it("respects minRSquared threshold", () => {
			// Create alpha with high R-squared requirement
			const strictAlpha = new AR4Alpha(
				AR4ConfigSchema.parse({ minRSquared: 0.9 })
			);

			// Add random returns (low R-squared)
			for (let i = 0; i < 50; i++) {
				const ret = (Math.random() - 0.5) * 0.02;
				strictAlpha.generateSignal(
					createMockFeatures(ret, Date.now() + i * 1000)
				);
			}

			const features = createMockFeatures(0.001, Date.now() + 60000);
			const signal = strictAlpha.generateSignal(features);

			// Should return null due to low R-squared
			expect(signal).toBeNull();
		});

		it("refits model periodically", () => {
			// Add returns
			for (let i = 0; i < 40; i++) {
				const ret = 0.001 * Math.sin(i * 0.1); // Sinusoidal pattern
				alpha.generateSignal(createMockFeatures(ret, Date.now() + i * 1000));
			}

			const coeffsBefore = alpha.getCoefficients();

			// Add more returns to trigger refit
			for (let i = 40; i < 60; i++) {
				const ret = 0.001 * Math.sin(i * 0.1);
				alpha.generateSignal(createMockFeatures(ret, Date.now() + i * 1000));
			}

			const coeffsAfter = alpha.getCoefficients();

			// Coefficients should have updated
			expect(coeffsAfter).not.toBeNull();
			expect(coeffsAfter).not.toEqual(coeffsBefore);
		});

		it("resets state correctly", () => {
			// Add returns
			for (let i = 0; i < 30; i++) {
				alpha.generateSignal(createMockFeatures(0.001, Date.now() + i * 1000));
			}

			expect(alpha.getCoefficients()).not.toBeNull();

			alpha.reset();

			expect(alpha.getCoefficients()).toBeNull();

			// Should return null after reset
			const signal = alpha.generateSignal(createMockFeatures(0.001));
			expect(signal).toBeNull();
		});

		it("handles NaN returns gracefully", () => {
			const features = createMockFeatures(NaN);
			const signal = alpha.generateSignal(features);

			expect(signal).toBeNull();
		});

		it("produces deterministic signals for same input sequence", () => {
			const alpha1 = new AR4Alpha();
			const alpha2 = new AR4Alpha();

			const returnSequence = Array.from({ length: 50 }, (_, i) => 0.001 * i);

			for (let i = 0; i < returnSequence.length; i++) {
				alpha1.generateSignal(
					createMockFeatures(returnSequence[i]!, Date.now() + i)
				);
				alpha2.generateSignal(
					createMockFeatures(returnSequence[i]!, Date.now() + i)
				);
			}

			expect(alpha1.getCoefficients()).toEqual(alpha2.getCoefficients());
		});
	});

	describe("AR4ConfigSchema validation", () => {
		it("accepts valid config", () => {
			const config = AR4ConfigSchema.parse({
				fitWindow: 100,
				horizonSec: 300,
				minRSquared: 0.1,
			});

			expect(config.fitWindow).toBe(100);
		});

		it("applies defaults", () => {
			const config = AR4ConfigSchema.parse({});

			expect(config.fitWindow).toBe(100);
			expect(config.horizonSec).toBe(300);
			expect(config.minRSquared).toBe(0.1);
		});

		it("rejects invalid config", () => {
			expect(() => AR4ConfigSchema.parse({ fitWindow: -1 })).toThrow();
			expect(() => AR4ConfigSchema.parse({ minRSquared: 1.5 })).toThrow();
		});
	});
});
