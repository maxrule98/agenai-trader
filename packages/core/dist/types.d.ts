/**
 * @file packages/core/src/types.ts
 *
 * Canonical data contracts for the AI-native quant trading platform.
 * All boundaries validate with Zod. Types are inferred from schemas.
 *
 * Assumptions:
 * - timestamps are Unix ms (number)
 * - prices and sizes are numbers (not BigInt or Decimal for now; consider upgrading for FX precision)
 * - exchange and symbol strings are uppercase by convention
 * - AlphaSignal scores are [-1..1], confidence [0..1]
 * - Action metadata is flexible JSON for strategy context
 */
import { z } from "zod";
/**
 * OHLCV Bar - standardized across exchanges
 */
export declare const BarSchema: z.ZodObject<{
    /** Unix timestamp (ms) of bar open */
    t: z.ZodNumber;
    /** Open price */
    o: z.ZodNumber;
    /** High price */
    h: z.ZodNumber;
    /** Low price */
    l: z.ZodNumber;
    /** Close price */
    c: z.ZodNumber;
    /** Volume in base currency */
    v: z.ZodNumber;
    /** Exchange identifier (uppercase) */
    exch: z.ZodString;
    /** Symbol/pair (uppercase) */
    symbol: z.ZodString;
    /** Timeframe (e.g., '1m', '5m', '1h', '1d') */
    tf: z.ZodString;
}, "strict", z.ZodTypeAny, {
    symbol: string;
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    exch: string;
    tf: string;
}, {
    symbol: string;
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    exch: string;
    tf: string;
}>;
export type Bar = z.infer<typeof BarSchema>;
/**
 * Level 2 Order Book Update
 */
export declare const L2UpdateSchema: z.ZodObject<{
    /** Unix timestamp (ms) of update */
    t: z.ZodNumber;
    /** Exchange identifier */
    exch: z.ZodString;
    /** Symbol/pair */
    symbol: z.ZodString;
    /** Bid levels [price, size][] sorted descending by price */
    bids: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
    /** Ask levels [price, size][] sorted ascending by price */
    asks: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
    /** Sequence number for ordering updates */
    seq: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    symbol: string;
    t: number;
    exch: string;
    bids: [number, number][];
    asks: [number, number][];
    seq: number;
}, {
    symbol: string;
    t: number;
    exch: string;
    bids: [number, number][];
    asks: [number, number][];
    seq: number;
}>;
export type L2Update = z.infer<typeof L2UpdateSchema>;
/**
 * Feature vector computed from market data
 */
export declare const FeaturesSchema: z.ZodObject<{
    /** Unix timestamp (ms) */
    t: z.ZodNumber;
    /** Exchange identifier */
    exch: z.ZodString;
    /** Symbol/pair */
    symbol: z.ZodString;
    /** Timeframe used for feature computation */
    tf: z.ZodString;
    /** Feature values as key-value pairs */
    vals: z.ZodRecord<z.ZodString, z.ZodNumber>;
    /** Optional regime label (e.g., 'trending', 'ranging', 'volatile') */
    regime: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    symbol: string;
    t: number;
    exch: string;
    tf: string;
    vals: Record<string, number>;
    regime?: string | undefined;
}, {
    symbol: string;
    t: number;
    exch: string;
    tf: string;
    vals: Record<string, number>;
    regime?: string | undefined;
}>;
export type Features = z.infer<typeof FeaturesSchema>;
/**
 * AlphaSignal - directional prediction from a strategy
 */
export declare const AlphaSignalSchema: z.ZodObject<{
    /** Unique signal ID (for tracking and replay) */
    id: z.ZodString;
    /** Unix timestamp (ms) */
    t: z.ZodNumber;
    /** Symbol/pair */
    symbol: z.ZodString;
    /** Exchange identifier */
    exch: z.ZodString;
    /** Timeframe context */
    tf: z.ZodString;
    /** Signal score: -1 (strong sell) to +1 (strong buy) */
    score: z.ZodNumber;
    /** Confidence: 0 (no confidence) to 1 (full confidence) */
    conf: z.ZodNumber;
    /** Horizon in seconds (how long signal is valid) */
    horizon_sec: z.ZodNumber;
    /** Optional explanation for transparency */
    explain: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    symbol: string;
    t: number;
    exch: string;
    tf: string;
    id: string;
    score: number;
    conf: number;
    horizon_sec: number;
    explain?: string | undefined;
}, {
    symbol: string;
    t: number;
    exch: string;
    tf: string;
    id: string;
    score: number;
    conf: number;
    horizon_sec: number;
    explain?: string | undefined;
}>;
export type AlphaSignal = z.infer<typeof AlphaSignalSchema>;
/**
 * Side of trade
 */
export declare const SideSchema: z.ZodEnum<["buy", "sell"]>;
export type Side = z.infer<typeof SideSchema>;
/**
 * Bracket order configuration (take-profit and stop-loss)
 */
export declare const BracketSchema: z.ZodObject<{
    /** Take-profit price */
    tp: z.ZodOptional<z.ZodNumber>;
    /** Stop-loss price */
    sl: z.ZodOptional<z.ZodNumber>;
    /** Trailing stop distance (in price units or percentage) */
    trail: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    tp?: number | undefined;
    sl?: number | undefined;
    trail?: number | undefined;
}, {
    tp?: number | undefined;
    sl?: number | undefined;
    trail?: number | undefined;
}>;
export type Bracket = z.infer<typeof BracketSchema>;
/**
 * Action - intended trade action from policy layer
 */
export declare const ActionSchema: z.ZodObject<{
    /** Unix timestamp (ms) */
    t: z.ZodNumber;
    /** Symbol/pair */
    symbol: z.ZodString;
    /** Exchange identifier */
    exch: z.ZodString;
    /** Side: buy or sell */
    side: z.ZodEnum<["buy", "sell"]>;
    /** Position size (in base currency) */
    size: z.ZodNumber;
    /** Optional entry price (limit order), omit for market */
    entry: z.ZodOptional<z.ZodNumber>;
    /** Optional bracket (TP/SL) */
    bracket: z.ZodOptional<z.ZodObject<{
        /** Take-profit price */
        tp: z.ZodOptional<z.ZodNumber>;
        /** Stop-loss price */
        sl: z.ZodOptional<z.ZodNumber>;
        /** Trailing stop distance (in price units or percentage) */
        trail: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        tp?: number | undefined;
        sl?: number | undefined;
        trail?: number | undefined;
    }, {
        tp?: number | undefined;
        sl?: number | undefined;
        trail?: number | undefined;
    }>>;
    /** Arbitrary metadata (strategy ID, alpha signal ID, etc.) */
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strict", z.ZodTypeAny, {
    symbol: string;
    t: number;
    exch: string;
    side: "buy" | "sell";
    size: number;
    entry?: number | undefined;
    bracket?: {
        tp?: number | undefined;
        sl?: number | undefined;
        trail?: number | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    symbol: string;
    t: number;
    exch: string;
    side: "buy" | "sell";
    size: number;
    entry?: number | undefined;
    bracket?: {
        tp?: number | undefined;
        sl?: number | undefined;
        trail?: number | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type Action = z.infer<typeof ActionSchema>;
/**
 * RiskVerdict - result of risk check
 */
export declare const RiskVerdictSchema: z.ZodObject<{
    /** Whether action is allowed */
    allow: z.ZodBoolean;
    /** Reason if rejected or adjusted */
    reason: z.ZodOptional<z.ZodString>;
    /** Adjusted action if risk system modified it */
    adjusted: z.ZodOptional<z.ZodObject<{
        /** Unix timestamp (ms) */
        t: z.ZodNumber;
        /** Symbol/pair */
        symbol: z.ZodString;
        /** Exchange identifier */
        exch: z.ZodString;
        /** Side: buy or sell */
        side: z.ZodEnum<["buy", "sell"]>;
        /** Position size (in base currency) */
        size: z.ZodNumber;
        /** Optional entry price (limit order), omit for market */
        entry: z.ZodOptional<z.ZodNumber>;
        /** Optional bracket (TP/SL) */
        bracket: z.ZodOptional<z.ZodObject<{
            /** Take-profit price */
            tp: z.ZodOptional<z.ZodNumber>;
            /** Stop-loss price */
            sl: z.ZodOptional<z.ZodNumber>;
            /** Trailing stop distance (in price units or percentage) */
            trail: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        }, {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        }>>;
        /** Arbitrary metadata (strategy ID, alpha signal ID, etc.) */
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        symbol: string;
        t: number;
        exch: string;
        side: "buy" | "sell";
        size: number;
        entry?: number | undefined;
        bracket?: {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        } | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        symbol: string;
        t: number;
        exch: string;
        side: "buy" | "sell";
        size: number;
        entry?: number | undefined;
        bracket?: {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        } | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    allow: boolean;
    reason?: string | undefined;
    adjusted?: {
        symbol: string;
        t: number;
        exch: string;
        side: "buy" | "sell";
        size: number;
        entry?: number | undefined;
        bracket?: {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        } | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | undefined;
}, {
    allow: boolean;
    reason?: string | undefined;
    adjusted?: {
        symbol: string;
        t: number;
        exch: string;
        side: "buy" | "sell";
        size: number;
        entry?: number | undefined;
        bracket?: {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        } | undefined;
        metadata?: Record<string, unknown> | undefined;
    } | undefined;
}>;
export type RiskVerdict = z.infer<typeof RiskVerdictSchema>;
/**
 * All schemas for programmatic access
 */
export declare const schemas: {
    readonly Bar: z.ZodObject<{
        /** Unix timestamp (ms) of bar open */
        t: z.ZodNumber;
        /** Open price */
        o: z.ZodNumber;
        /** High price */
        h: z.ZodNumber;
        /** Low price */
        l: z.ZodNumber;
        /** Close price */
        c: z.ZodNumber;
        /** Volume in base currency */
        v: z.ZodNumber;
        /** Exchange identifier (uppercase) */
        exch: z.ZodString;
        /** Symbol/pair (uppercase) */
        symbol: z.ZodString;
        /** Timeframe (e.g., '1m', '5m', '1h', '1d') */
        tf: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        symbol: string;
        t: number;
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
        exch: string;
        tf: string;
    }, {
        symbol: string;
        t: number;
        o: number;
        h: number;
        l: number;
        c: number;
        v: number;
        exch: string;
        tf: string;
    }>;
    readonly L2Update: z.ZodObject<{
        /** Unix timestamp (ms) of update */
        t: z.ZodNumber;
        /** Exchange identifier */
        exch: z.ZodString;
        /** Symbol/pair */
        symbol: z.ZodString;
        /** Bid levels [price, size][] sorted descending by price */
        bids: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
        /** Ask levels [price, size][] sorted ascending by price */
        asks: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
        /** Sequence number for ordering updates */
        seq: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        symbol: string;
        t: number;
        exch: string;
        bids: [number, number][];
        asks: [number, number][];
        seq: number;
    }, {
        symbol: string;
        t: number;
        exch: string;
        bids: [number, number][];
        asks: [number, number][];
        seq: number;
    }>;
    readonly Features: z.ZodObject<{
        /** Unix timestamp (ms) */
        t: z.ZodNumber;
        /** Exchange identifier */
        exch: z.ZodString;
        /** Symbol/pair */
        symbol: z.ZodString;
        /** Timeframe used for feature computation */
        tf: z.ZodString;
        /** Feature values as key-value pairs */
        vals: z.ZodRecord<z.ZodString, z.ZodNumber>;
        /** Optional regime label (e.g., 'trending', 'ranging', 'volatile') */
        regime: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        symbol: string;
        t: number;
        exch: string;
        tf: string;
        vals: Record<string, number>;
        regime?: string | undefined;
    }, {
        symbol: string;
        t: number;
        exch: string;
        tf: string;
        vals: Record<string, number>;
        regime?: string | undefined;
    }>;
    readonly AlphaSignal: z.ZodObject<{
        /** Unique signal ID (for tracking and replay) */
        id: z.ZodString;
        /** Unix timestamp (ms) */
        t: z.ZodNumber;
        /** Symbol/pair */
        symbol: z.ZodString;
        /** Exchange identifier */
        exch: z.ZodString;
        /** Timeframe context */
        tf: z.ZodString;
        /** Signal score: -1 (strong sell) to +1 (strong buy) */
        score: z.ZodNumber;
        /** Confidence: 0 (no confidence) to 1 (full confidence) */
        conf: z.ZodNumber;
        /** Horizon in seconds (how long signal is valid) */
        horizon_sec: z.ZodNumber;
        /** Optional explanation for transparency */
        explain: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        symbol: string;
        t: number;
        exch: string;
        tf: string;
        id: string;
        score: number;
        conf: number;
        horizon_sec: number;
        explain?: string | undefined;
    }, {
        symbol: string;
        t: number;
        exch: string;
        tf: string;
        id: string;
        score: number;
        conf: number;
        horizon_sec: number;
        explain?: string | undefined;
    }>;
    readonly Action: z.ZodObject<{
        /** Unix timestamp (ms) */
        t: z.ZodNumber;
        /** Symbol/pair */
        symbol: z.ZodString;
        /** Exchange identifier */
        exch: z.ZodString;
        /** Side: buy or sell */
        side: z.ZodEnum<["buy", "sell"]>;
        /** Position size (in base currency) */
        size: z.ZodNumber;
        /** Optional entry price (limit order), omit for market */
        entry: z.ZodOptional<z.ZodNumber>;
        /** Optional bracket (TP/SL) */
        bracket: z.ZodOptional<z.ZodObject<{
            /** Take-profit price */
            tp: z.ZodOptional<z.ZodNumber>;
            /** Stop-loss price */
            sl: z.ZodOptional<z.ZodNumber>;
            /** Trailing stop distance (in price units or percentage) */
            trail: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        }, {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        }>>;
        /** Arbitrary metadata (strategy ID, alpha signal ID, etc.) */
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        symbol: string;
        t: number;
        exch: string;
        side: "buy" | "sell";
        size: number;
        entry?: number | undefined;
        bracket?: {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        } | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        symbol: string;
        t: number;
        exch: string;
        side: "buy" | "sell";
        size: number;
        entry?: number | undefined;
        bracket?: {
            tp?: number | undefined;
            sl?: number | undefined;
            trail?: number | undefined;
        } | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly RiskVerdict: z.ZodObject<{
        /** Whether action is allowed */
        allow: z.ZodBoolean;
        /** Reason if rejected or adjusted */
        reason: z.ZodOptional<z.ZodString>;
        /** Adjusted action if risk system modified it */
        adjusted: z.ZodOptional<z.ZodObject<{
            /** Unix timestamp (ms) */
            t: z.ZodNumber;
            /** Symbol/pair */
            symbol: z.ZodString;
            /** Exchange identifier */
            exch: z.ZodString;
            /** Side: buy or sell */
            side: z.ZodEnum<["buy", "sell"]>;
            /** Position size (in base currency) */
            size: z.ZodNumber;
            /** Optional entry price (limit order), omit for market */
            entry: z.ZodOptional<z.ZodNumber>;
            /** Optional bracket (TP/SL) */
            bracket: z.ZodOptional<z.ZodObject<{
                /** Take-profit price */
                tp: z.ZodOptional<z.ZodNumber>;
                /** Stop-loss price */
                sl: z.ZodOptional<z.ZodNumber>;
                /** Trailing stop distance (in price units or percentage) */
                trail: z.ZodOptional<z.ZodNumber>;
            }, "strict", z.ZodTypeAny, {
                tp?: number | undefined;
                sl?: number | undefined;
                trail?: number | undefined;
            }, {
                tp?: number | undefined;
                sl?: number | undefined;
                trail?: number | undefined;
            }>>;
            /** Arbitrary metadata (strategy ID, alpha signal ID, etc.) */
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strict", z.ZodTypeAny, {
            symbol: string;
            t: number;
            exch: string;
            side: "buy" | "sell";
            size: number;
            entry?: number | undefined;
            bracket?: {
                tp?: number | undefined;
                sl?: number | undefined;
                trail?: number | undefined;
            } | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            symbol: string;
            t: number;
            exch: string;
            side: "buy" | "sell";
            size: number;
            entry?: number | undefined;
            bracket?: {
                tp?: number | undefined;
                sl?: number | undefined;
                trail?: number | undefined;
            } | undefined;
            metadata?: Record<string, unknown> | undefined;
        }>>;
    }, "strict", z.ZodTypeAny, {
        allow: boolean;
        reason?: string | undefined;
        adjusted?: {
            symbol: string;
            t: number;
            exch: string;
            side: "buy" | "sell";
            size: number;
            entry?: number | undefined;
            bracket?: {
                tp?: number | undefined;
                sl?: number | undefined;
                trail?: number | undefined;
            } | undefined;
            metadata?: Record<string, unknown> | undefined;
        } | undefined;
    }, {
        allow: boolean;
        reason?: string | undefined;
        adjusted?: {
            symbol: string;
            t: number;
            exch: string;
            side: "buy" | "sell";
            size: number;
            entry?: number | undefined;
            bracket?: {
                tp?: number | undefined;
                sl?: number | undefined;
                trail?: number | undefined;
            } | undefined;
            metadata?: Record<string, unknown> | undefined;
        } | undefined;
    }>;
    readonly Side: z.ZodEnum<["buy", "sell"]>;
    readonly Bracket: z.ZodObject<{
        /** Take-profit price */
        tp: z.ZodOptional<z.ZodNumber>;
        /** Stop-loss price */
        sl: z.ZodOptional<z.ZodNumber>;
        /** Trailing stop distance (in price units or percentage) */
        trail: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        tp?: number | undefined;
        sl?: number | undefined;
        trail?: number | undefined;
    }, {
        tp?: number | undefined;
        sl?: number | undefined;
        trail?: number | undefined;
    }>;
};
//# sourceMappingURL=types.d.ts.map