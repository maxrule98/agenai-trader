import { describe, it, expect } from "vitest";
import {
	sma,
	ema,
	wma,
	variance,
	stddev,
	atr,
	rsi,
	macd,
	percentChange,
	simpleReturn,
	logReturn,
} from "../src/rolling.js";

describe("@ai-quant/features rolling indicators", () => {
	describe("sma", () => {
		it("calculates simple moving average", () => {
			const values = [1, 2, 3, 4, 5];
			expect(sma(values, 3)).toBe(4); // (3+4+5)/3
			expect(sma(values, 5)).toBe(3); // (1+2+3+4+5)/5
		});

		it("returns NaN for insufficient data", () => {
			expect(sma([1, 2], 3)).toBeNaN();
			expect(sma([], 1)).toBeNaN();
		});

		it("returns NaN for invalid period", () => {
			expect(sma([1, 2, 3], 0)).toBeNaN();
			expect(sma([1, 2, 3], -1)).toBeNaN();
		});
	});

	describe("ema", () => {
		it("calculates exponential moving average", () => {
			const values = [10, 11, 12, 13, 14];
			const period = 3;

			// First EMA uses SMA as seed
			const firstEma = ema(values.slice(0, 3), period);
			expect(firstEma).toBe(11); // SMA(10,11,12) = 11

			// Next EMA uses previous
			const secondEma = ema([values[3]!], period, firstEma);
			expect(secondEma).toBeCloseTo(12, 1); // (13-11)*0.5 + 11
		});

		it("returns NaN for insufficient data without prevEma", () => {
			expect(ema([1, 2], 3)).toBeNaN();
		});

		it("handles edge cases", () => {
			expect(ema([], 3)).toBeNaN();
			expect(ema([1], 0)).toBeNaN();
		});
	});

	describe("wma", () => {
		it("calculates weighted moving average", () => {
			const values = [1, 2, 3, 4, 5];
			// WMA(3) = (3*1 + 4*2 + 5*3) / (1+2+3) = (3+8+15)/6 = 26/6 ≈ 4.33
			expect(wma(values, 3)).toBeCloseTo(4.33, 2);
		});

		it("returns NaN for insufficient data", () => {
			expect(wma([1, 2], 3)).toBeNaN();
		});
	});

	describe("variance", () => {
		it("calculates sample variance", () => {
			const values = [2, 4, 4, 4, 5, 5, 7, 9];
			const v = variance(values, 8);
			expect(v).toBeCloseTo(4.57, 2); // Known value
		});

		it("returns NaN for insufficient data", () => {
			expect(variance([1], 2)).toBeNaN();
			expect(variance([1, 2], 1)).toBeNaN(); // Need at least 2 for sample variance
		});
	});

	describe("stddev", () => {
		it("calculates standard deviation", () => {
			const values = [2, 4, 4, 4, 5, 5, 7, 9];
			const sd = stddev(values, 8);
			expect(sd).toBeCloseTo(Math.sqrt(4.57), 2);
		});

		it("returns NaN for insufficient data", () => {
			expect(stddev([1], 2)).toBeNaN();
		});
	});

	describe("atr", () => {
		it("calculates average true range", () => {
			const highs = [48, 50, 49, 51, 52];
			const lows = [46, 47, 46, 48, 49];
			const closes = [47, 49, 47, 50, 51];

			const result = atr(highs, lows, closes, 3);
			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(10); // Sanity check
		});

		it("handles first bar correctly", () => {
			const highs = [50];
			const lows = [45];
			const closes = [48];

			const result = atr(highs, lows, closes, 1);
			expect(result).toBe(5); // high - low
		});

		it("returns NaN for insufficient data", () => {
			expect(atr([1, 2], [1, 2], [1, 2], 3)).toBeNaN();
		});

		it("handles mismatched array lengths", () => {
			const result = atr([1, 2, 3], [1, 2], [1, 2, 3], 2);
			expect(result).not.toBeNaN(); // Uses min length
		});
	});

	describe("rsi", () => {
		it("calculates relative strength index", () => {
			// Uptrend scenario
			const uptrend = [
				44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
			];
			const rsiUp = rsi(uptrend, 14);
			expect(rsiUp).toBeGreaterThan(50); // Should indicate overbought
			expect(rsiUp).toBeLessThanOrEqual(100);

			// Downtrend scenario
			const downtrend = [
				58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44,
			];
			const rsiDown = rsi(downtrend, 14);
			expect(rsiDown).toBeLessThan(50); // Should indicate oversold
			expect(rsiDown).toBeGreaterThanOrEqual(0);
		});

		it("returns 50 for flat prices", () => {
			const flat = Array(20).fill(50);
			const result = rsi(flat, 14);
			expect(result).toBe(50);
		});

		it("returns 100 for pure gains with no losses", () => {
			const gains = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
			const result = rsi(gains, 14);
			expect(result).toBe(100);
		});

		it("returns NaN for insufficient data", () => {
			expect(rsi([1, 2, 3], 14)).toBeNaN();
		});
	});

	describe("macd", () => {
		it("calculates MACD with default periods", () => {
			// Create trending data
			const values = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
			const result = macd(values);

			expect(result.macd).not.toBeNaN();
			expect(result.signal).not.toBeNaN();
			expect(result.histogram).not.toBeNaN();
			expect(result.histogram).toBeCloseTo(result.macd - result.signal, 10);
		});

		it("calculates MACD with custom periods", () => {
			const values = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
			const result = macd(values, 5, 10, 3);

			expect(result.macd).not.toBeNaN();
		});

		it("returns NaN for insufficient data", () => {
			const result = macd([1, 2, 3, 4, 5], 12, 26, 9);
			expect(result.macd).toBeNaN();
			expect(result.signal).toBeNaN();
			expect(result.histogram).toBeNaN();
		});

		it("handles uptrend correctly", () => {
			const uptrend = Array.from({ length: 50 }, (_, i) => 100 + i);
			const result = macd(uptrend);

			expect(result.macd).toBeGreaterThan(0); // Fast above slow in uptrend
		});
	});

	describe("percentChange", () => {
		it("calculates percentage change", () => {
			expect(percentChange(110, 100)).toBe(10);
			expect(percentChange(90, 100)).toBe(-10);
			expect(percentChange(100, 100)).toBe(0);
		});

		it("returns NaN for zero previous value", () => {
			expect(percentChange(10, 0)).toBeNaN();
		});
	});

	describe("simpleReturn", () => {
		it("calculates simple return", () => {
			expect(simpleReturn(110, 100)).toBe(0.1);
			expect(simpleReturn(90, 100)).toBe(-0.1);
			expect(simpleReturn(100, 100)).toBe(0);
		});

		it("returns NaN for zero previous value", () => {
			expect(simpleReturn(10, 0)).toBeNaN();
		});
	});

	describe("logReturn", () => {
		it("calculates log return", () => {
			const result = logReturn(110, 100);
			expect(result).toBeCloseTo(Math.log(1.1), 10);
		});

		it("returns NaN for non-positive values", () => {
			expect(logReturn(0, 100)).toBeNaN();
			expect(logReturn(100, 0)).toBeNaN();
			expect(logReturn(-10, 100)).toBeNaN();
		});
	});

	describe("determinism and purity", () => {
		it("produces identical results for same inputs", () => {
			const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

			const sma1 = sma(values, 5);
			const sma2 = sma(values, 5);
			expect(sma1).toBe(sma2);

			const ema1 = ema(values, 5);
			const ema2 = ema(values, 5);
			expect(ema1).toBe(ema2);

			const rsi1 = rsi(values, 5);
			const rsi2 = rsi(values, 5);
			expect(rsi1).toBe(rsi2);
		});

		it("does not mutate input arrays", () => {
			const values = [1, 2, 3, 4, 5];
			const original = [...values];

			sma(values, 3);
			expect(values).toEqual(original);

			ema(values, 3);
			expect(values).toEqual(original);

			wma(values, 3);
			expect(values).toEqual(original);
		});
	});
});
