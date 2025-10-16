import { describe, it, expect, beforeEach } from "vitest";
import {
	ReplayEngine,
	ReplayEvent,
	ReplayConfig,
	parseSessionLog,
	compareReplays,
	serializeEvents,
} from "../src/replay.js";

describe("@ai-quant/sim replay", () => {
	const mockSessionMetadata = {
		sessionId: "test-session-1",
		seed: "test-seed-42",
		startTs: 1697529600000,
		endTs: 1697529900000,
	};

	const mockEvents: ReplayEvent[] = [
		{
			type: "bar",
			ts: 1697529600000,
			data: {
				t: 1697529600000,
				o: 50000,
				h: 50100,
				l: 49900,
				c: 50050,
				v: 100,
				exch: "BINANCE",
				symbol: "BTCUSDT",
				tf: "1m",
			},
		},
		{
			type: "alpha_signal",
			ts: 1697529660000,
			data: {
				id: "sig-1",
				t: 1697529660000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				tf: "1m",
				score: 0.7,
				conf: 0.85,
				horizon_sec: 60,
			},
		},
		{
			type: "action",
			ts: 1697529661000,
			data: {
				t: 1697529661000,
				symbol: "BTCUSDT",
				exch: "BINANCE",
				side: "buy",
				size: 0.1,
			},
		},
	];

	describe("ReplayEngine", () => {
		let engine: ReplayEngine;
		let config: ReplayConfig;

		beforeEach(() => {
			config = {
				session: mockSessionMetadata,
				events: mockEvents,
				speed: 0, // instant
			};
			engine = new ReplayEngine(config);
		});

		it("creates engine with deterministic RNG", () => {
			const rng1 = new ReplayEngine(config);
			const rng2 = new ReplayEngine(config);

			// Same seed should produce same sequence
			expect(rng1.random()).toBe(rng2.random());
			expect(rng1.random()).toBe(rng2.random());
		});

		it("emits events to registered handlers", async () => {
			const receivedEvents: ReplayEvent[] = [];

			engine.on("*", (event) => {
				receivedEvents.push(event);
			});

			await engine.run();

			expect(receivedEvents).toHaveLength(mockEvents.length);
			expect(receivedEvents[0]?.type).toBe("bar");
			expect(receivedEvents[1]?.type).toBe("alpha_signal");
			expect(receivedEvents[2]?.type).toBe("action");
		});

		it("filters events by type", async () => {
			const filteredConfig: ReplayConfig = {
				...config,
				filter: ["bar", "action"],
			};
			const filteredEngine = new ReplayEngine(filteredConfig);
			const receivedEvents: ReplayEvent[] = [];

			filteredEngine.on("*", (event) => {
				receivedEvents.push(event);
			});

			await filteredEngine.run();

			expect(receivedEvents).toHaveLength(2);
			expect(receivedEvents[0]?.type).toBe("bar");
			expect(receivedEvents[1]?.type).toBe("action");
		});

		it("supports type-specific handlers", async () => {
			const barEvents: ReplayEvent[] = [];
			const signalEvents: ReplayEvent[] = [];

			engine.on("bar", (event) => {
				barEvents.push(event);
			});

			engine.on("alpha_signal", (event) => {
				signalEvents.push(event);
			});

			await engine.run();

			expect(barEvents).toHaveLength(1);
			expect(signalEvents).toHaveLength(1);
		});

		it("supports step-by-step execution", async () => {
			const event1 = await engine.step();
			expect(event1?.type).toBe("bar");

			const event2 = await engine.step();
			expect(event2?.type).toBe("alpha_signal");

			const event3 = await engine.step();
			expect(event3?.type).toBe("action");

			const event4 = await engine.step();
			expect(event4).toBeNull(); // End of events
		});

		it("tracks progress correctly", async () => {
			expect(engine.getProgress()).toEqual({
				current: 0,
				total: 3,
				percent: 0,
			});

			await engine.step();
			expect(engine.getProgress().current).toBe(1);
			expect(engine.getProgress().percent).toBeCloseTo(33.33, 1);

			await engine.step();
			await engine.step();
			expect(engine.getProgress()).toEqual({
				current: 3,
				total: 3,
				percent: 100,
			});
		});

		it("resets to beginning", async () => {
			await engine.step();
			await engine.step();
			expect(engine.getProgress().current).toBe(2);

			engine.reset();
			expect(engine.getProgress().current).toBe(0);
		});

		it("can pause and resume", async () => {
			let eventCount = 0;
			engine.on("*", () => {
				eventCount++;
			});

			// Start running
			const runPromise = engine.run();

			// Pause immediately (in reality would be during execution)
			engine.pause();

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Should not have processed all events yet (depends on timing)
			// This is a weak test due to instant speed; better with speed > 0

			engine.resume();
			await runPromise;

			expect(eventCount).toBe(mockEvents.length);
		});
	});

	describe("parseSessionLog", () => {
		it("parses valid JSONL", () => {
			const jsonl = mockEvents.map((e) => JSON.stringify(e)).join("\n");
			const config = parseSessionLog(jsonl, "session-1", "seed-123");

			expect(config.session.sessionId).toBe("session-1");
			expect(config.session.seed).toBe("seed-123");
			expect(config.events).toHaveLength(mockEvents.length);
			expect(config.session.startTs).toBe(1697529600000);
			expect(config.session.endTs).toBe(1697529661000);
		});

		it("sorts events by timestamp", () => {
			const unsortedEvents: ReplayEvent[] = [
				{ type: "action", ts: 3000, data: {} },
				{ type: "bar", ts: 1000, data: {} },
				{ type: "alpha_signal", ts: 2000, data: {} },
			];

			const jsonl = unsortedEvents.map((e) => JSON.stringify(e)).join("\n");
			const config = parseSessionLog(jsonl, "session-1", "seed-123");

			expect(config.events[0]?.ts).toBe(1000);
			expect(config.events[1]?.ts).toBe(2000);
			expect(config.events[2]?.ts).toBe(3000);
		});

		it("handles empty lines", () => {
			const jsonl = [
				JSON.stringify(mockEvents[0]),
				"",
				JSON.stringify(mockEvents[1]),
				"  ",
				JSON.stringify(mockEvents[2]),
			].join("\n");

			const config = parseSessionLog(jsonl, "session-1", "seed-123");
			expect(config.events).toHaveLength(3);
		});
	});

	describe("compareReplays", () => {
		it("returns equal for identical replays", () => {
			const result = compareReplays(mockEvents, mockEvents);
			expect(result.equal).toBe(true);
			expect(result.diffs).toHaveLength(0);
		});

		it("detects length mismatch", () => {
			const result = compareReplays(mockEvents, mockEvents.slice(0, 2));
			expect(result.equal).toBe(false);
			expect(result.diffs).toContain("Event count mismatch: expected 3, got 2");
		});

		it("detects type mismatch", () => {
			const modified = [...mockEvents];
			modified[1] = { ...modified[1]!, type: "action" };

			const result = compareReplays(mockEvents, modified);
			expect(result.equal).toBe(false);
			expect(result.diffs[0]).toContain("type mismatch");
		});

		it("detects timestamp mismatch", () => {
			const modified = [...mockEvents];
			modified[1] = { ...modified[1]!, ts: 9999999 };

			const result = compareReplays(mockEvents, modified);
			expect(result.equal).toBe(false);
			expect(result.diffs[0]).toContain("timestamp mismatch");
		});

		it("detects data mismatch", () => {
			const modified = [...mockEvents];
			modified[0] = {
				...modified[0]!,
				data: { ...modified[0]!.data, different: true },
			};

			const result = compareReplays(mockEvents, modified);
			expect(result.equal).toBe(false);
			expect(result.diffs[0]).toContain("data mismatch");
		});
	});

	describe("serializeEvents", () => {
		it("serializes events to JSONL", () => {
			const jsonl = serializeEvents(mockEvents);
			const lines = jsonl.split("\n");

			expect(lines).toHaveLength(mockEvents.length);
			expect(JSON.parse(lines[0]!)).toEqual(mockEvents[0]);
			expect(JSON.parse(lines[1]!)).toEqual(mockEvents[1]);
			expect(JSON.parse(lines[2]!)).toEqual(mockEvents[2]);
		});
	});

	describe("golden file integration", () => {
		it("produces deterministic output for golden file testing", async () => {
			const config: ReplayConfig = {
				session: mockSessionMetadata,
				events: mockEvents,
				speed: 0,
			};

			// Run 1
			const engine1 = new ReplayEngine(config);
			const results1: ReplayEvent[] = [];
			engine1.on("*", (event) => results1.push(event));
			await engine1.run();

			// Run 2 with same config
			const engine2 = new ReplayEngine(config);
			const results2: ReplayEvent[] = [];
			engine2.on("*", (event) => results2.push(event));
			await engine2.run();

			// Should be identical (golden file test)
			const comparison = compareReplays(results1, results2);
			expect(comparison.equal).toBe(true);

			// RNG should produce same sequence
			const engine3 = new ReplayEngine(config);
			const engine4 = new ReplayEngine(config);
			const rngSeq1 = [engine3.random(), engine3.random(), engine3.random()];
			const rngSeq2 = [engine4.random(), engine4.random(), engine4.random()];
			expect(rngSeq1).toEqual(rngSeq2);
		});
	});
});
