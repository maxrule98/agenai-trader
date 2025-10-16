/**
 * @file packages/sim/src/replay.ts
 *
 * Deterministic replay engine for AI-Quant platform.
 *
 * Features:
 * - Seeded RNG for reproducible simulations
 * - Event log parsing and re-emission
 * - Golden-file test harness for capital-safe validation
 * - Time-travel debugging for strategy development
 *
 * Assumptions:
 * - Session logs are JSONL (newline-delimited JSON)
 * - Each log line has {type, ts, data} structure
 * - RNG seed is stored in session metadata for replay
 * - Events are emitted in strict chronological order
 */

import seedrandom from "seedrandom";
import {
	Bar,
	AlphaSignal,
	Action,
	RiskVerdict,
	Features,
} from "@ai-quant/core";

// ============================================================================
// Types
// ============================================================================

/**
 * Event types that can be replayed
 */
export type ReplayEventType =
	| "bar"
	| "features"
	| "alpha_signal"
	| "action"
	| "risk_verdict"
	| "order"
	| "fill";

/**
 * Replay event wrapper
 */
export interface ReplayEvent {
	/** Event type */
	type: ReplayEventType;
	/** Unix timestamp (ms) */
	ts: number;
	/** Event data (type-specific) */
	data: unknown;
	/** Optional metadata */
	meta?: Record<string, unknown>;
}

/**
 * Session metadata for replay
 */
export interface SessionMetadata {
	/** Session ID */
	sessionId: string;
	/** RNG seed for determinism */
	seed: string;
	/** Start timestamp (ms) */
	startTs: number;
	/** End timestamp (ms) */
	endTs: number;
	/** Strategy configuration snapshot */
	config?: Record<string, unknown>;
}

/**
 * Replay configuration
 */
export interface ReplayConfig {
	/** Session metadata */
	session: SessionMetadata;
	/** Events to replay */
	events: ReplayEvent[];
	/** Speed multiplier (1.0 = real-time, 0 = instant) */
	speed?: number;
	/** Event type filter (omit for all) */
	filter?: ReplayEventType[];
}

/**
 * Replay handler - receives events during replay
 */
export type ReplayHandler = (event: ReplayEvent) => void | Promise<void>;

// ============================================================================
// Replay Engine
// ============================================================================

/**
 * Deterministic replay engine
 */
export class ReplayEngine {
	private rng: seedrandom.PRNG;
	private config: ReplayConfig;
	private handlers: Map<ReplayEventType | "*", ReplayHandler[]> = new Map();
	private isPaused = false;
	private currentEventIndex = 0;

	constructor(config: ReplayConfig) {
		this.config = config;
		this.rng = seedrandom(config.session.seed);
	}

	/**
	 * Register an event handler
	 */
	on(eventType: ReplayEventType | "*", handler: ReplayHandler): void {
		const handlers = this.handlers.get(eventType) ?? [];
		handlers.push(handler);
		this.handlers.set(eventType, handlers);
	}

	/**
	 * Remove an event handler
	 */
	off(eventType: ReplayEventType | "*", handler: ReplayHandler): void {
		const handlers = this.handlers.get(eventType);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index !== -1) {
				handlers.splice(index, 1);
			}
		}
	}

	/**
	 * Get next random number (deterministic)
	 */
	random(): number {
		return this.rng();
	}

	/**
	 * Pause replay
	 */
	pause(): void {
		this.isPaused = true;
	}

	/**
	 * Resume replay
	 */
	resume(): void {
		this.isPaused = false;
	}

	/**
	 * Reset replay to beginning
	 */
	reset(): void {
		this.currentEventIndex = 0;
		this.isPaused = false;
		this.rng = seedrandom(this.config.session.seed);
	}

	/**
	 * Run replay to completion
	 */
	async run(): Promise<void> {
		const { events, speed = 0, filter } = this.config;
		const filteredEvents = filter
			? events.filter((e) => filter.includes(e.type))
			: events;

		let lastTs = filteredEvents[0]?.ts ?? 0;

		for (let i = 0; i < filteredEvents.length; i++) {
			if (this.isPaused) {
				// Wait until resumed
				await new Promise<void>((resolve) => {
					const check = setInterval(() => {
						if (!this.isPaused) {
							clearInterval(check);
							resolve();
						}
					}, 100);
				});
			}

			const event = filteredEvents[i]!;
			this.currentEventIndex = i;

			// Simulate time passage if speed > 0
			if (speed > 0) {
				const deltaMs = event.ts - lastTs;
				const delayMs = deltaMs / speed;
				if (delayMs > 0) {
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}
			}

			// Emit to handlers
			await this.emitEvent(event);
			lastTs = event.ts;
		}
	}

	/**
	 * Run a single step (advance to next event)
	 */
	async step(): Promise<ReplayEvent | null> {
		const { events, filter } = this.config;
		const filteredEvents = filter
			? events.filter((e) => filter.includes(e.type))
			: events;

		if (this.currentEventIndex >= filteredEvents.length) {
			return null;
		}

		const event = filteredEvents[this.currentEventIndex]!;
		this.currentEventIndex++;
		await this.emitEvent(event);
		return event;
	}

	/**
	 * Get current position in replay
	 */
	getProgress(): { current: number; total: number; percent: number } {
		const total = this.config.events.length;
		const current = this.currentEventIndex;
		const percent = total > 0 ? (current / total) * 100 : 0;
		return { current, total, percent };
	}

	/**
	 * Emit event to registered handlers
	 */
	private async emitEvent(event: ReplayEvent): Promise<void> {
		const specificHandlers = this.handlers.get(event.type) ?? [];
		const wildcardHandlers = this.handlers.get("*") ?? [];
		const allHandlers = [...specificHandlers, ...wildcardHandlers];

		for (const handler of allHandlers) {
			await handler(event);
		}
	}
}

// ============================================================================
// Session Log Parser
// ============================================================================

/**
 * Parse JSONL session log into replay config
 */
export function parseSessionLog(
	jsonl: string,
	sessionId: string,
	seed: string
): ReplayConfig {
	const lines = jsonl.trim().split("\n");
	const events: ReplayEvent[] = [];
	let minTs = Infinity;
	let maxTs = -Infinity;

	for (const line of lines) {
		if (!line.trim()) continue;

		try {
			const event = JSON.parse(line) as ReplayEvent;
			events.push(event);
			minTs = Math.min(minTs, event.ts);
			maxTs = Math.max(maxTs, event.ts);
		} catch (err) {
			console.warn(`Failed to parse log line: ${line}`, err);
		}
	}

	// Sort by timestamp to ensure chronological order
	events.sort((a, b) => a.ts - b.ts);

	return {
		session: {
			sessionId,
			seed,
			startTs: minTs === Infinity ? Date.now() : minTs,
			endTs: maxTs === -Infinity ? Date.now() : maxTs,
		},
		events,
	};
}

// ============================================================================
// Golden File Utilities
// ============================================================================

/**
 * Compare two replay runs for equality (golden file testing)
 */
export function compareReplays(
	expected: ReplayEvent[],
	actual: ReplayEvent[]
): { equal: boolean; diffs: string[] } {
	const diffs: string[] = [];

	if (expected.length !== actual.length) {
		diffs.push(
			`Event count mismatch: expected ${expected.length}, got ${actual.length}`
		);
	}

	const minLength = Math.min(expected.length, actual.length);
	for (let i = 0; i < minLength; i++) {
		const exp = expected[i]!;
		const act = actual[i]!;

		if (exp.type !== act.type) {
			diffs.push(
				`Event ${i}: type mismatch (expected ${exp.type}, got ${act.type})`
			);
		}

		if (exp.ts !== act.ts) {
			diffs.push(
				`Event ${i}: timestamp mismatch (expected ${exp.ts}, got ${act.ts})`
			);
		}

		// Deep compare data (stringified for simplicity)
		const expData = JSON.stringify(exp.data);
		const actData = JSON.stringify(act.data);
		if (expData !== actData) {
			diffs.push(
				`Event ${i}: data mismatch\nExpected: ${expData}\nGot: ${actData}`
			);
		}
	}

	return {
		equal: diffs.length === 0,
		diffs,
	};
}

/**
 * Serialize replay events to JSONL for golden file storage
 */
export function serializeEvents(events: ReplayEvent[]): string {
	return events.map((e) => JSON.stringify(e)).join("\n");
}
