import { describe, it, expect } from "vitest";
import {
	maxDailyLossRule,
	maxExposureRule,
	leverageCapRule,
	staleFeedRule,
} from "../src/risk/rules";

describe("Risk Rules", () => {
	const base = {
		symbol: "BTCUSDT",
		exch: "BINANCE",
		pnl: 0,
		exposure: 0,
		maxDailyLoss: 100,
		maxExposure: 1000,
		leverage: 1,
		maxLeverage: 3,
		feedStale: false,
	};

	it("maxDailyLossRule blocks when pnl < -maxDailyLoss", () => {
		expect(maxDailyLossRule({ ...base, pnl: -101 }).allow).toBe(false);
		expect(maxDailyLossRule({ ...base, pnl: -99 }).allow).toBe(true);
	});

	it("maxExposureRule blocks when exposure > maxExposure", () => {
		expect(maxExposureRule({ ...base, exposure: 1001 }).allow).toBe(false);
		expect(maxExposureRule({ ...base, exposure: 999 }).allow).toBe(true);
	});

	it("leverageCapRule blocks when leverage > maxLeverage", () => {
		expect(leverageCapRule({ ...base, leverage: 4 }).allow).toBe(false);
		expect(leverageCapRule({ ...base, leverage: 2 }).allow).toBe(true);
	});

	it("staleFeedRule blocks when feedStale", () => {
		expect(staleFeedRule({ ...base, feedStale: true }).allow).toBe(false);
		expect(staleFeedRule({ ...base, feedStale: false }).allow).toBe(true);
	});
});
