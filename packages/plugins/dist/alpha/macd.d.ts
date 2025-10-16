/**
 * @file packages/plugins/src/alpha/macd.ts
 *
 * MACD (Moving Average Convergence Divergence) Alpha Plugin
 *
 * Generates signals based on MACD crossovers and histogram divergence.
 * This is a classic momentum/trend-following indicator.
 *
 * Signal Logic:
 * - Bullish: MACD line crosses above signal line (or histogram > 0 and increasing)
 * - Bearish: MACD line crosses below signal line (or histogram < 0 and decreasing)
 * - Confidence based on histogram magnitude and trend consistency
 *
 * Assumptions:
 * - MACD values are computed in features
 * - Signal strength is proportional to histogram magnitude
 * - Crossovers are detected by comparing current and previous states
 */
import { z } from "zod";
import { Features, AlphaSignal } from "@ai-quant/core";
export declare const MACDConfigSchema: z.ZodObject<{
    /** Minimum histogram magnitude to emit signal (noise filter) */
    minHistogram: z.ZodDefault<z.ZodNumber>;
    /** Horizon in seconds for signal validity */
    horizonSec: z.ZodDefault<z.ZodNumber>;
    /** Use crossover detection (vs histogram-only) */
    useCrossover: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    minHistogram: number;
    horizonSec: number;
    useCrossover: boolean;
}, {
    minHistogram?: number | undefined;
    horizonSec?: number | undefined;
    useCrossover?: boolean | undefined;
}>;
export type MACDConfig = z.infer<typeof MACDConfigSchema>;
interface MACDState {
    /** Previous MACD value */
    prevMacd: number | null;
    /** Previous signal line value */
    prevSignal: number | null;
    /** Previous histogram value */
    prevHistogram: number | null;
}
/**
 * MACD Alpha Plugin
 *
 * Maintains state for crossover detection.
 */
export declare class MACDAlpha {
    private config;
    private state;
    constructor(config?: MACDConfig);
    /**
     * Generate signal from features
     *
     * @param features - Latest features (must include macd, macd_signal, macd_histogram)
     * @returns AlphaSignal or null
     */
    generateSignal(features: Features): AlphaSignal | null;
    /**
     * Detect MACD crossover
     *
     * @param macd - Current MACD value
     * @param signal - Current signal line value
     * @returns 'bullish', 'bearish', or null
     */
    private detectCrossover;
    /**
     * Compute signal from histogram
     *
     * @param histogram - MACD histogram value
     * @returns Signal with score, confidence, and explanation
     */
    private computeHistogramSignal;
    /**
     * Update internal state
     */
    private updateState;
    /**
     * Reset plugin state
     */
    reset(): void;
    /**
     * Get current state (for debugging/testing)
     */
    getState(): MACDState;
}
export {};
//# sourceMappingURL=macd.d.ts.map