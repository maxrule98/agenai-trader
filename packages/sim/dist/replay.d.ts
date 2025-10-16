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
/**
 * Event types that can be replayed
 */
export type ReplayEventType = "bar" | "features" | "alpha_signal" | "action" | "risk_verdict" | "order" | "fill";
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
/**
 * Deterministic replay engine
 */
export declare class ReplayEngine {
    private rng;
    private config;
    private handlers;
    private isPaused;
    private currentEventIndex;
    constructor(config: ReplayConfig);
    /**
     * Register an event handler
     */
    on(eventType: ReplayEventType | "*", handler: ReplayHandler): void;
    /**
     * Remove an event handler
     */
    off(eventType: ReplayEventType | "*", handler: ReplayHandler): void;
    /**
     * Get next random number (deterministic)
     */
    random(): number;
    /**
     * Pause replay
     */
    pause(): void;
    /**
     * Resume replay
     */
    resume(): void;
    /**
     * Reset replay to beginning
     */
    reset(): void;
    /**
     * Run replay to completion
     */
    run(): Promise<void>;
    /**
     * Run a single step (advance to next event)
     */
    step(): Promise<ReplayEvent | null>;
    /**
     * Get current position in replay
     */
    getProgress(): {
        current: number;
        total: number;
        percent: number;
    };
    /**
     * Emit event to registered handlers
     */
    private emitEvent;
}
/**
 * Parse JSONL session log into replay config
 */
export declare function parseSessionLog(jsonl: string, sessionId: string, seed: string): ReplayConfig;
/**
 * Compare two replay runs for equality (golden file testing)
 */
export declare function compareReplays(expected: ReplayEvent[], actual: ReplayEvent[]): {
    equal: boolean;
    diffs: string[];
};
/**
 * Serialize replay events to JSONL for golden file storage
 */
export declare function serializeEvents(events: ReplayEvent[]): string;
//# sourceMappingURL=replay.d.ts.map