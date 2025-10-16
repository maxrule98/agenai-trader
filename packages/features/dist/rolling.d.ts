/**
 * @file packages/features/src/rolling.ts
 *
 * Rolling window indicators for technical analysis.
 * All functions are pure and deterministic.
 *
 * Assumptions:
 * - Input arrays are in chronological order (oldest first)
 * - Prices are positive numbers
 * - Window sizes are positive integers
 * - NaN/Infinity checks are caller's responsibility for performance
 */
/**
 * Simple Moving Average (SMA)
 *
 * @param values - Array of values (e.g., close prices)
 * @param period - Window size
 * @returns SMA value, or NaN if insufficient data
 */
export declare function sma(values: number[], period: number): number;
/**
 * Exponential Moving Average (EMA)
 *
 * Uses the standard multiplier: 2 / (period + 1)
 *
 * @param values - Array of values
 * @param period - Window size
 * @param prevEma - Previous EMA value (optional, uses SMA if not provided)
 * @returns EMA value, or NaN if insufficient data
 */
export declare function ema(values: number[], period: number, prevEma?: number): number;
/**
 * Weighted Moving Average (WMA)
 *
 * Recent values have higher weight: weight = index + 1
 *
 * @param values - Array of values
 * @param period - Window size
 * @returns WMA value, or NaN if insufficient data
 */
export declare function wma(values: number[], period: number): number;
/**
 * Sample variance
 *
 * @param values - Array of values
 * @param period - Window size
 * @returns Variance, or NaN if insufficient data
 */
export declare function variance(values: number[], period: number): number;
/**
 * Sample standard deviation
 *
 * @param values - Array of values
 * @param period - Window size
 * @returns Standard deviation, or NaN if insufficient data
 */
export declare function stddev(values: number[], period: number): number;
/**
 * Average True Range (ATR)
 *
 * Measures market volatility using high-low-close data.
 *
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of close prices
 * @param period - Window size
 * @returns ATR value, or NaN if insufficient data
 */
export declare function atr(highs: number[], lows: number[], closes: number[], period: number): number;
/**
 * Relative Strength Index (RSI)
 *
 * Measures momentum on a scale of 0-100.
 *
 * @param values - Array of prices (typically close)
 * @param period - Window size (typically 14)
 * @returns RSI value [0-100], or NaN if insufficient data
 */
export declare function rsi(values: number[], period: number): number;
/**
 * MACD (Moving Average Convergence Divergence)
 *
 * Returns MACD line, signal line, and histogram.
 *
 * @param values - Array of prices (typically close)
 * @param fastPeriod - Fast EMA period (typically 12)
 * @param slowPeriod - Slow EMA period (typically 26)
 * @param signalPeriod - Signal line EMA period (typically 9)
 * @returns {macd, signal, histogram}, or NaN values if insufficient data
 */
export declare function macd(values: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): {
    macd: number;
    signal: number;
    histogram: number;
};
/**
 * Calculate percentage change
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change, or NaN if previous is zero
 */
export declare function percentChange(current: number, previous: number): number;
/**
 * Calculate simple return
 *
 * @param current - Current price
 * @param previous - Previous price
 * @returns Return (not percentage), or NaN if previous is zero
 */
export declare function simpleReturn(current: number, previous: number): number;
/**
 * Calculate log return
 *
 * @param current - Current price
 * @param previous - Previous price
 * @returns Log return, or NaN if either value is non-positive
 */
export declare function logReturn(current: number, previous: number): number;
//# sourceMappingURL=rolling.d.ts.map