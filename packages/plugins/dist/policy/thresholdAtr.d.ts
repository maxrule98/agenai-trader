/**
 * @file packages/plugins/src/policy/thresholdAtr.ts
 *
 * Threshold-ATR Policy Plugin
 *
 * Converts AlphaSignals to Actions using:
 * - Score threshold with hysteresis (enter/exit thresholds different)
 * - ATR-based position sizing and bracket orders (TP/SL)
 * - Capital-safe risk management
 *
 * Policy Logic:
 * 1. Only act if |signal.score| > threshold
 * 2. Apply hysteresis: higher threshold to enter, lower to exit
 * 3. Size position based on fixed notional or ATR-based risk
 * 4. Set TP at 2x ATR, SL at 1x ATR from entry
 *
 * Assumptions:
 * - Features contain ATR value
 * - Signal score is in [-1, 1]
 * - Current price is in features
 */
import { z } from "zod";
import { AlphaSignal, Features, Action, Side } from "@ai-quant/core";
export declare const ThresholdAtrConfigSchema: z.ZodObject<{
    /** Threshold to enter position (|score| must exceed this) */
    enterThreshold: z.ZodDefault<z.ZodNumber>;
    /** Threshold to exit position (|score| drops below this) */
    exitThreshold: z.ZodDefault<z.ZodNumber>;
    /** Fixed notional per trade (in quote currency) */
    fixedNotional: z.ZodDefault<z.ZodNumber>;
    /** Use ATR-based sizing (overrides fixedNotional if true) */
    useAtrSizing: z.ZodDefault<z.ZodBoolean>;
    /** ATR multiplier for position sizing (if useAtrSizing=true) */
    atrSizingMultiplier: z.ZodDefault<z.ZodNumber>;
    /** ATR multiplier for take-profit */
    atrTpMultiplier: z.ZodDefault<z.ZodNumber>;
    /** ATR multiplier for stop-loss */
    atrSlMultiplier: z.ZodDefault<z.ZodNumber>;
    /** Maximum position size (absolute, in base currency) */
    maxSize: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    enterThreshold: number;
    exitThreshold: number;
    fixedNotional: number;
    useAtrSizing: boolean;
    atrSizingMultiplier: number;
    atrTpMultiplier: number;
    atrSlMultiplier: number;
    maxSize: number;
}, {
    enterThreshold?: number | undefined;
    exitThreshold?: number | undefined;
    fixedNotional?: number | undefined;
    useAtrSizing?: boolean | undefined;
    atrSizingMultiplier?: number | undefined;
    atrTpMultiplier?: number | undefined;
    atrSlMultiplier?: number | undefined;
    maxSize?: number | undefined;
}>;
export type ThresholdAtrConfig = z.infer<typeof ThresholdAtrConfigSchema>;
interface PolicyState {
    /** Current position side (null if flat) */
    side: Side | null;
    /** Current position size (0 if flat) */
    size: number;
}
/**
 * Threshold-ATR Policy Plugin
 *
 * Maintains position state and generates Actions from AlphaSignals.
 */
export declare class ThresholdAtrPolicy {
    private config;
    private state;
    constructor(config?: ThresholdAtrConfig);
    /**
     * Generate Action from AlphaSignal and Features
     *
     * @param signal - Alpha signal
     * @param features - Current market features (must include atr_14 and close)
     * @returns Action or null
     */
    generateAction(signal: AlphaSignal, features: Features): Action | null;
    /**
     * Build Action to open new position
     */
    private buildOpenAction;
    /**
     * Build Action to close existing position
     */
    private buildCloseAction;
    /**
     * Compute bracket orders (TP/SL) based on ATR
     *
     * @param entryPrice - Entry price
     * @param atr - ATR value
     * @param side - Position side
     * @returns Bracket configuration
     */
    private computeBracket;
    /**
     * Get current policy state
     */
    getState(): PolicyState;
    /**
     * Reset policy state
     */
    reset(): void;
    /**
     * Check if currently in a position
     */
    isFlat(): boolean;
}
export {};
//# sourceMappingURL=thresholdAtr.d.ts.map