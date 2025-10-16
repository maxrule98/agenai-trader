import { describe, it, expect } from "vitest";
import {
	BarSchema,
	L2UpdateSchema,
	FeaturesSchema,
	AlphaSignalSchema,
	ActionSchema,
	RiskVerdictSchema,
	type Bar,
	type L2Update,
	type Features,
	type AlphaSignal,
	type Action,
	type RiskVerdict,
} from "../src/types.js";

describe("@ai-quant/core types", () => {
	describe("BarSchema", () => {
		it("validates a correct Bar", () => {
			const bar: Bar = {
				t: 1697529600000,
				o: 50000.0,
				h: 50100.0,
				l: 49900.0,
				c: 50050.0,
				v: 123.45,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1m",
			};
			expect(() => BarSchema.parse(bar)).not.toThrow();
		});

		it("rejects negative volume", () => {
			const bar = {
				t: 1697529600000,
				o: 50000,
				h: 50100,
				l: 49900,
				c: 50050,
				v: -10,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1m",
			};
			expect(() => BarSchema.parse(bar)).toThrow();
		});

		it("rejects invalid timeframe format", () => {
			const bar = {
				t: 1697529600000,
				o: 50000,
				h: 50100,
				l: 49900,
				c: 50050,
				v: 100,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "invalid",
			};
			expect(() => BarSchema.parse(bar)).toThrow();
		});
	});

	describe("L2UpdateSchema", () => {
		it("validates a correct L2Update", () => {
			const l2: L2Update = {
				t: 1697529600000,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				bids: [
					[50000.0, 1.5],
					[49999.0, 2.0],
				],
				asks: [
					[50001.0, 1.2],
					[50002.0, 1.8],
				],
				seq: 12345,
			};
			expect(() => L2UpdateSchema.parse(l2)).not.toThrow();
		});

		it("allows empty bid/ask arrays", () => {
			const l2 = {
				t: 1697529600000,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				bids: [],
				asks: [],
				seq: 0,
			};
			expect(() => L2UpdateSchema.parse(l2)).not.toThrow();
		});
	});

	describe("FeaturesSchema", () => {
		it("validates a correct Features object", () => {
			const features: Features = {
				t: 1697529600000,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "5m",
				vals: {
					rsi_14: 65.3,
					macd: 0.0012,
					atr_20: 150.5,
				},
				regime: "trending",
			};
			expect(() => FeaturesSchema.parse(features)).not.toThrow();
		});

		it("allows missing regime", () => {
			const features = {
				t: 1697529600000,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1h",
				vals: { sma_50: 50000 },
			};
			expect(() => FeaturesSchema.parse(features)).not.toThrow();
		});
	});

	describe("AlphaSignalSchema", () => {
		it("validates a correct AlphaSignal", () => {
			const signal: AlphaSignal = {
				id: "sig-123",
				t: 1697529600000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				tf: "15m",
				score: 0.75,
				conf: 0.9,
				horizon_sec: 900,
				explain: "Strong upward momentum detected",
			};
			expect(() => AlphaSignalSchema.parse(signal)).not.toThrow();
		});

		it("rejects score outside [-1, 1]", () => {
			const signal = {
				id: "sig-123",
				t: 1697529600000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				tf: "15m",
				score: 1.5,
				conf: 0.9,
				horizon_sec: 900,
			};
			expect(() => AlphaSignalSchema.parse(signal)).toThrow();
		});

		it("rejects confidence outside [0, 1]", () => {
			const signal = {
				id: "sig-123",
				t: 1697529600000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				tf: "15m",
				score: 0.5,
				conf: 1.2,
				horizon_sec: 900,
			};
			expect(() => AlphaSignalSchema.parse(signal)).toThrow();
		});
	});

	describe("ActionSchema", () => {
		it("validates a market order action", () => {
			const action: Action = {
				t: 1697529600000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				side: "buy",
				size: 0.1,
				metadata: {
					strategyId: "momentum-v1",
					signalId: "sig-123",
				},
			};
			expect(() => ActionSchema.parse(action)).not.toThrow();
		});

		it("validates a limit order with bracket", () => {
			const action: Action = {
				t: 1697529600000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				side: "buy",
				size: 0.1,
				entry: 50000.0,
				bracket: {
					tp: 51000.0,
					sl: 49500.0,
				},
			};
			expect(() => ActionSchema.parse(action)).not.toThrow();
		});

		it("rejects negative size", () => {
			const action = {
				t: 1697529600000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				side: "buy",
				size: -0.1,
			};
			expect(() => ActionSchema.parse(action)).toThrow();
		});
	});

	describe("RiskVerdictSchema", () => {
		it("validates allowed verdict", () => {
			const verdict: RiskVerdict = {
				allow: true,
			};
			expect(() => RiskVerdictSchema.parse(verdict)).not.toThrow();
		});

		it("validates rejected verdict with reason", () => {
			const verdict: RiskVerdict = {
				allow: false,
				reason: "Daily drawdown limit exceeded",
			};
			expect(() => RiskVerdictSchema.parse(verdict)).not.toThrow();
		});

		it("validates adjusted verdict", () => {
			const verdict: RiskVerdict = {
				allow: true,
				reason: "Size reduced to comply with exposure cap",
				adjusted: {
					t: 1697529600000,
					symbol: "BTCUSDT",
					exch: "BINANCE",
					side: "buy",
					size: 0.05, // reduced from 0.1
				},
			};
			expect(() => RiskVerdictSchema.parse(verdict)).not.toThrow();
		});
	});
});
