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
import { BarSchema, FeaturesSchema } from "@ai-quant/core";
import { sma, ema, stddev, atr, rsi, macd, simpleReturn, } from "./rolling.js";
// ============================================================================
// Configuration Schema
// ============================================================================
export const FeatureConfigSchema = z
    .object({
    /** Window size for rolling calculations */
    window: z.number().int().positive().default(20),
    /** RSI period */
    rsiPeriod: z.number().int().positive().default(14),
    /** ATR period */
    atrPeriod: z.number().int().positive().default(14),
    /** MACD fast period */
    macdFast: z.number().int().positive().default(12),
    /** MACD slow period */
    macdSlow: z.number().int().positive().default(26),
    /** MACD signal period */
    macdSignal: z.number().int().positive().default(9),
    /** Volatility bucket thresholds (low/med/high) */
    volBuckets: z
        .object({
        low: z.number().positive().default(0.01),
        high: z.number().positive().default(0.03),
    })
        .default({ low: 0.01, high: 0.03 }),
})
    .strict();
// ============================================================================
// Regime Classification
// ============================================================================
export var Regime;
(function (Regime) {
    Regime["TRENDING_UP"] = "trending_up";
    Regime["TRENDING_DOWN"] = "trending_down";
    Regime["RANGING"] = "ranging";
    Regime["VOLATILE"] = "volatile";
})(Regime || (Regime = {}));
/**
 * Classify market regime based on features
 *
 * @param trendStrength - Trend strength indicator [0-1]
 * @param volatility - Normalized volatility
 * @returns Regime classification
 */
export function classifyRegime(trendStrength, volatility) {
    if (volatility > 2.0) {
        return Regime.VOLATILE;
    }
    if (Math.abs(trendStrength) > 0.6) {
        return trendStrength > 0 ? Regime.TRENDING_UP : Regime.TRENDING_DOWN;
    }
    return Regime.RANGING;
}
// ============================================================================
// Feature Computation
// ============================================================================
/**
 * Compute returns from bar data
 *
 * @param bars - Array of bars (chronological)
 * @returns Object with simple and log returns
 */
export function computeReturns(bars) {
    if (bars.length < 2) {
        return { simpleReturn: NaN, logReturn: NaN };
    }
    const current = bars[bars.length - 1].c;
    const previous = bars[bars.length - 2].c;
    return {
        simpleReturn: simpleReturn(current, previous),
        logReturn: Math.log(current / previous),
    };
}
/**
 * Compute z-score for a value given mean and stddev
 *
 * @param value - Value to normalize
 * @param mean - Mean of distribution
 * @param std - Standard deviation of distribution
 * @returns Z-score, or NaN if std is zero
 */
export function zScore(value, mean, std) {
    if (std === 0)
        return NaN;
    return (value - mean) / std;
}
/**
 * Compute volatility bucket based on realized volatility
 *
 * @param volatility - Realized volatility (e.g., stddev of returns)
 * @param thresholds - Bucket thresholds
 * @returns Volatility bucket: 'low', 'medium', or 'high'
 */
export function volatilityBucket(volatility, thresholds) {
    if (volatility < thresholds.low)
        return "low";
    if (volatility > thresholds.high)
        return "high";
    return "medium";
}
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
export function computeTrendStrength(bars, config) {
    if (bars.length < config.window)
        return NaN;
    const closes = bars.map((b) => b.c);
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    const fastEma = ema(closes, 10);
    const slowEma = ema(closes, 20);
    const atrVal = atr(highs, lows, closes, config.atrPeriod);
    if (isNaN(fastEma) || isNaN(slowEma) || isNaN(atrVal) || atrVal === 0) {
        return NaN;
    }
    // Normalize by ATR to make it scale-independent
    const trendStrength = (fastEma - slowEma) / atrVal;
    // Clamp to [-1, 1] for consistency
    return Math.max(-1, Math.min(1, trendStrength));
}
/**
 * Stub implementation of NormalizationCache
 *
 * Returns null to indicate cache miss.
 * In production, replace with actual Redis client.
 */
export class StubNormalizationCache {
    async getMean(_key) {
        return null;
    }
    async getStdDev(_key) {
        return null;
    }
    async setMean(_key, _value) {
        // No-op
    }
    async setStdDev(_key, _value) {
        // No-op
    }
}
// ============================================================================
// Main Feature Factory
// ============================================================================
/**
 * Build Features from a window of Bars
 *
 * @param bars - Array of bars (chronological, oldest first)
 * @param config - Feature configuration
 * @param cache - Normalization cache (optional)
 * @returns Features object, validated with Zod
 */
export async function buildFeatures(bars, config = FeatureConfigSchema.parse({}), cache = new StubNormalizationCache()) {
    // Validate inputs
    const validatedBars = bars.map((b) => BarSchema.parse(b));
    const validatedConfig = FeatureConfigSchema.parse(config);
    if (validatedBars.length < validatedConfig.window) {
        throw new Error(`Insufficient data: need ${validatedConfig.window} bars, got ${validatedBars.length}`);
    }
    const latestBar = validatedBars[validatedBars.length - 1];
    const closes = validatedBars.map((b) => b.c);
    const highs = validatedBars.map((b) => b.h);
    const lows = validatedBars.map((b) => b.l);
    // Compute raw features
    const returns = computeReturns(validatedBars);
    const sma20 = sma(closes, 20);
    const ema12 = ema(closes, validatedConfig.macdFast);
    const ema26 = ema(closes, validatedConfig.macdSlow);
    const rsi14 = rsi(closes, validatedConfig.rsiPeriod);
    const atr14 = atr(highs, lows, closes, validatedConfig.atrPeriod);
    const macdResult = macd(closes, validatedConfig.macdFast, validatedConfig.macdSlow, validatedConfig.macdSignal);
    const volatility = stddev(closes, validatedConfig.window);
    const trendStrength = computeTrendStrength(validatedBars, validatedConfig);
    // Compute z-scores (use cache or compute from window)
    const cacheKey = `${latestBar.exch}:${latestBar.symbol}:${latestBar.tf}`;
    const cachedMean = await cache.getMean(cacheKey);
    const cachedStd = await cache.getStdDev(cacheKey);
    const meanClose = cachedMean ?? sma20;
    const stdClose = cachedStd ?? volatility;
    const zScoreClose = zScore(latestBar.c, meanClose, stdClose);
    // Update cache (fire and forget)
    if (cachedMean === null) {
        cache.setMean(cacheKey, sma20).catch(() => {
            /* ignore cache errors */
        });
    }
    if (cachedStd === null) {
        cache.setStdDev(cacheKey, volatility).catch(() => {
            /* ignore cache errors */
        });
    }
    // Classify regime
    const regime = classifyRegime(trendStrength, volatility / meanClose);
    // Build feature values
    const vals = {
        close: latestBar.c,
        return_1: returns.simpleReturn,
        log_return_1: returns.logReturn,
        sma_20: sma20,
        ema_12: ema12,
        ema_26: ema26,
        rsi_14: rsi14,
        atr_14: atr14,
        macd: macdResult.macd,
        macd_signal: macdResult.signal,
        macd_histogram: macdResult.histogram,
        volatility_20: volatility,
        trend_strength: trendStrength,
        z_score_close: zScoreClose,
    };
    // Build and validate Features object
    const features = {
        t: latestBar.t,
        exch: latestBar.exch,
        symbol: latestBar.symbol,
        tf: latestBar.tf,
        vals,
        regime,
    };
    return FeaturesSchema.parse(features);
}
/**
 * Convenience function to compute features synchronously (no cache)
 *
 * @param bars - Array of bars
 * @param config - Feature configuration
 * @returns Features object
 */
export function buildFeaturesSync(bars, config = FeatureConfigSchema.parse({})) {
    // Synchronous version without cache
    const validatedBars = bars.map((b) => BarSchema.parse(b));
    const validatedConfig = FeatureConfigSchema.parse(config);
    if (validatedBars.length < validatedConfig.window) {
        throw new Error(`Insufficient data: need ${validatedConfig.window} bars, got ${validatedBars.length}`);
    }
    const latestBar = validatedBars[validatedBars.length - 1];
    const closes = validatedBars.map((b) => b.c);
    const highs = validatedBars.map((b) => b.h);
    const lows = validatedBars.map((b) => b.l);
    const returns = computeReturns(validatedBars);
    const sma20 = sma(closes, 20);
    const ema12 = ema(closes, validatedConfig.macdFast);
    const ema26 = ema(closes, validatedConfig.macdSlow);
    const rsi14 = rsi(closes, validatedConfig.rsiPeriod);
    const atr14 = atr(highs, lows, closes, validatedConfig.atrPeriod);
    const macdResult = macd(closes, validatedConfig.macdFast, validatedConfig.macdSlow, validatedConfig.macdSignal);
    const volatility = stddev(closes, validatedConfig.window);
    const trendStrength = computeTrendStrength(validatedBars, validatedConfig);
    const meanClose = sma20;
    const stdClose = volatility;
    const zScoreClose = zScore(latestBar.c, meanClose, stdClose);
    const regime = classifyRegime(trendStrength, volatility / meanClose);
    const vals = {
        close: latestBar.c,
        return_1: returns.simpleReturn,
        log_return_1: returns.logReturn,
        sma_20: sma20,
        ema_12: ema12,
        ema_26: ema26,
        rsi_14: rsi14,
        atr_14: atr14,
        macd: macdResult.macd,
        macd_signal: macdResult.signal,
        macd_histogram: macdResult.histogram,
        volatility_20: volatility,
        trend_strength: trendStrength,
        z_score_close: zScoreClose,
    };
    const features = {
        t: latestBar.t,
        exch: latestBar.exch,
        symbol: latestBar.symbol,
        tf: latestBar.tf,
        vals,
        regime,
    };
    return FeaturesSchema.parse(features);
}
