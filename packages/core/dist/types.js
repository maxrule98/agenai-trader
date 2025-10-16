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
import { z } from 'zod';
// ============================================================================
// Market Data
// ============================================================================
/**
 * OHLCV Bar - standardized across exchanges
 */
export const BarSchema = z.object({
    /** Unix timestamp (ms) of bar open */
    t: z.number().int().positive(),
    /** Open price */
    o: z.number().positive(),
    /** High price */
    h: z.number().positive(),
    /** Low price */
    l: z.number().positive(),
    /** Close price */
    c: z.number().positive(),
    /** Volume in base currency */
    v: z.number().nonnegative(),
    /** Exchange identifier (uppercase) */
    exch: z.string().min(1),
    /** Symbol/pair (uppercase) */
    symbol: z.string().min(1),
    /** Timeframe (e.g., '1m', '5m', '1h', '1d') */
    tf: z.string().regex(/^\d+[smhd]$/),
}).strict();
/**
 * Level 2 Order Book Update
 */
export const L2UpdateSchema = z.object({
    /** Unix timestamp (ms) of update */
    t: z.number().int().positive(),
    /** Exchange identifier */
    exch: z.string().min(1),
    /** Symbol/pair */
    symbol: z.string().min(1),
    /** Bid levels [price, size][] sorted descending by price */
    bids: z.array(z.tuple([z.number().positive(), z.number().nonnegative()])),
    /** Ask levels [price, size][] sorted ascending by price */
    asks: z.array(z.tuple([z.number().positive(), z.number().nonnegative()])),
    /** Sequence number for ordering updates */
    seq: z.number().int().nonnegative(),
}).strict();
// ============================================================================
// Features
// ============================================================================
/**
 * Feature vector computed from market data
 */
export const FeaturesSchema = z.object({
    /** Unix timestamp (ms) */
    t: z.number().int().positive(),
    /** Exchange identifier */
    exch: z.string().min(1),
    /** Symbol/pair */
    symbol: z.string().min(1),
    /** Timeframe used for feature computation */
    tf: z.string().regex(/^\d+[smhd]$/),
    /** Feature values as key-value pairs */
    vals: z.record(z.string(), z.number()),
    /** Optional regime label (e.g., 'trending', 'ranging', 'volatile') */
    regime: z.string().optional(),
}).strict();
// ============================================================================
// Alpha & Strategy
// ============================================================================
/**
 * AlphaSignal - directional prediction from a strategy
 */
export const AlphaSignalSchema = z.object({
    /** Unique signal ID (for tracking and replay) */
    id: z.string().min(1),
    /** Unix timestamp (ms) */
    t: z.number().int().positive(),
    /** Symbol/pair */
    symbol: z.string().min(1),
    /** Exchange identifier */
    exch: z.string().min(1),
    /** Timeframe context */
    tf: z.string().regex(/^\d+[smhd]$/),
    /** Signal score: -1 (strong sell) to +1 (strong buy) */
    score: z.number().min(-1).max(1),
    /** Confidence: 0 (no confidence) to 1 (full confidence) */
    conf: z.number().min(0).max(1),
    /** Horizon in seconds (how long signal is valid) */
    horizon_sec: z.number().int().positive(),
    /** Optional explanation for transparency */
    explain: z.string().optional(),
}).strict();
// ============================================================================
// Trading Actions
// ============================================================================
/**
 * Side of trade
 */
export const SideSchema = z.enum(['buy', 'sell']);
/**
 * Bracket order configuration (take-profit and stop-loss)
 */
export const BracketSchema = z.object({
    /** Take-profit price */
    tp: z.number().positive().optional(),
    /** Stop-loss price */
    sl: z.number().positive().optional(),
    /** Trailing stop distance (in price units or percentage) */
    trail: z.number().positive().optional(),
}).strict();
/**
 * Action - intended trade action from policy layer
 */
export const ActionSchema = z.object({
    /** Unix timestamp (ms) */
    t: z.number().int().positive(),
    /** Symbol/pair */
    symbol: z.string().min(1),
    /** Exchange identifier */
    exch: z.string().min(1),
    /** Side: buy or sell */
    side: SideSchema,
    /** Position size (in base currency) */
    size: z.number().positive(),
    /** Optional entry price (limit order), omit for market */
    entry: z.number().positive().optional(),
    /** Optional bracket (TP/SL) */
    bracket: BracketSchema.optional(),
    /** Arbitrary metadata (strategy ID, alpha signal ID, etc.) */
    metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();
// ============================================================================
// Risk Management
// ============================================================================
/**
 * RiskVerdict - result of risk check
 */
export const RiskVerdictSchema = z.object({
    /** Whether action is allowed */
    allow: z.boolean(),
    /** Reason if rejected or adjusted */
    reason: z.string().optional(),
    /** Adjusted action if risk system modified it */
    adjusted: ActionSchema.optional(),
}).strict();
// ============================================================================
// Exports
// ============================================================================
/**
 * All schemas for programmatic access
 */
export const schemas = {
    Bar: BarSchema,
    L2Update: L2UpdateSchema,
    Features: FeaturesSchema,
    AlphaSignal: AlphaSignalSchema,
    Action: ActionSchema,
    RiskVerdict: RiskVerdictSchema,
    Side: SideSchema,
    Bracket: BracketSchema,
};
