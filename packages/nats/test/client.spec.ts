import { describe, it, expect } from "vitest";
import { MemoryBus } from "../src/client";
import { subjectFor } from "../src/subjects";

describe("MemoryBus", () => {
	it("pub/sub round-trip", async () => {
		const bus = new MemoryBus();
		let received: any = null;
		await bus.subscribe(
			subjectFor("features", "BINANCE", "BTCUSDT", "1m"),
			(msg) => {
				received = msg;
			}
		);
		await bus.publish(subjectFor("features", "BINANCE", "BTCUSDT", "1m"), {
			foo: 42,
		});
		expect(received).toEqual({ foo: 42 });
	});
});
