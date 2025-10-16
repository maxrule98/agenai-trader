/**
 * @file packages/features/src/factory.ts
 *
 * Feature factory for computing standardized Features from Bars.
 * Includes returns, z-scores, volatility bucketing, and trend strength.
 *
 * Assumptions:
 * - Redis cache is used for z-score normalization params (stub for now)
 * - Features are computed from a rolling window of bars
 * - All inputs are validated with Zod
 * - Pure functions for testability; cache interactions are side effects
 */
import { z } from "zod";
import { Bar, Features } from "@ai-quant/core";
export declare const FeatureConfigSchema: z.ZodObject<{
    /** Window size for rolling calculations */
    window: z.ZodDefault<z.ZodNumber>;
    /** RSI period */
    rsiPeriod: z.ZodDefault<z.ZodNumber>;
    /** ATR period */
    atrPeriod: z.ZodDefault<z.ZodNumber>;
    /** MACD fast period */
    macdFast: z.ZodDefault<z.ZodNumber>;
    /** MACD slow period */
    macdSlow: z.ZodDefault<z.ZodNumber>;
    /** MACD signal period */
    macdSignal: z.ZodDefault<z.ZodNumber>;
    /** Volatility bucket thresholds (low/med/high) */
    volBuckets: z.ZodDefault<z.ZodObject<{
        low: z.ZodDefault<z.ZodNumber>;
        high: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        low: number;
        high: number;
    }, {
        low?: number | undefined;
        high?: number | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    window: number;
    rsiPeriod: number;
    atrPeriod: number;
    macdFast: number;
    macdSlow: number;
    macdSignal: number;
    volBuckets: {
        low: number;
        high: number;
    };
}, {
    window?: number | undefined;
    rsiPeriod?: number | undefined;
    atrPeriod?: number | undefined;
    macdFast?: number | undefined;
    macdSlow?: number | undefined;
    macdSignal?: number | undefined;
    volBuckets?: {
        low?: number | undefined;
        high?: number | undefined;
    } | undefined;
}>;
export type FeatureConfig = z.infer<typeof FeatureConfigSchema>;
export declare enum Regime {
    TRENDING_UP = "trending_up",
    TRENDING_DOWN = "trending_down",
    RANGING = "ranging",
    VOLATILE = "volatile"
}
/**
 * Classify market regime based on features
 *
 * @param trendStrength - Trend strength indicator [0-1]
 * @param volatility - Normalized volatility
 * @returns Regime classification
 */
export declare function classifyRegime(trendStrength: number, volatility: number): Regime;
/**
 * Compute returns from bar data
 *
 * @param bars - Array of bars (chronological)
 * @returns Object with simple and log returns
 */
export declare function computeReturns(bars: Bar[]): {
    simpleReturn: number;
    logReturn: number;
};
/**
 * Compute z-score for a value given mean and stddev
 *
 * @param value - Value to normalize
 * @param mean - Mean of distribution
 * @param std - Standard deviation of distribution
 * @returns Z-score, or NaN if std is zero
 */
export declare function zScore(value: number, mean: number, std: number): number;
/**
 * Compute volatility bucket based on realized volatility
 *
 * @param volatility - Realized volatility (e.g., stddev of returns)
 * @param thresholds - Bucket thresholds
 * @returns Volatility bucket: 'low', 'medium', or 'high'
 */
export declare function volatilityBucket(volatility: number, thresholds: {
    low: number;
    high: number;
}): "low" | "medium" | "high";
/**
 * Compute trend strength from price action
 *
 * Uses the difference between fast and slow EMAs normalized by ATR.
 * Returns a value roughly in [-1, 1] where:
 * - Positive = uptrend
 * - Negative = downtrend
 * - Near zero = ranging
 *
 * @param bars - Array of bars
 * @param config - Feature configuration
 * @returns Trend strength indicator
 */
export declare function computeTrendStrength(bars: Bar[], config: FeatureConfig): number;
/**
 * Redis cache interface for normalization parameters
 *
 * In production, this would connect to Redis to store/retrieve
 * rolling mean and stddev for z-score normalization.
 *
 * For now, it's a stub that returns mock values.
 */
export interface NormalizationCache {
    getMean(key: string): Promise<number | null>;
    getStdDev(key: string): Promise<number | null>;
    setMean(key: string, value: number): Promise<void>;
    setStdDev(key: string, value: number): Promise<void>;
}
/**
 * Stub implementation of NormalizationCache
 *
 * Returns null to indicate cache miss.
 * In production, replace with actual Redis client.
 */
export declare class StubNormalizationCache implements NormalizationCache {
    getMean(_key: string): Promise<number | null>;
    getStdDev(_key: string): Promise<number | null>;
    setMean(_key: string, _value: number): Promise<void>;
    setStdDev(_key: string, _value: number): Promise<void>;
}
/**
 * Build Features from a window of Bars
 *
 * @param bars - Array of bars (chronological, oldest first)
 * @param config - Feature configuration
 * @param cache - Normalization cache (optional)
 * @returns Features object, validated with Zod
 */
export declare function buildFeatures(bars: Bar[], config?: FeatureConfig, cache?: NormalizationCache): Promise<Features>;
/**
 * Convenience function to compute features synchronously (no cache)
 *
 * @param bars - Array of bars
 * @param config - Feature configuration
 * @returns Features object
 */
export declare function buildFeaturesSync(bars: Bar[], config?: FeatureConfig): Features;
//# sourceMappingURL=factory.d.ts.map