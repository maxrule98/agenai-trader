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
// ============================================================================
// Moving Averages
// ============================================================================
/**
 * Simple Moving Average (SMA)
 *
 * @param values - Array of values (e.g., close prices)
 * @param period - Window size
 * @returns SMA value, or NaN if insufficient data
 */
export function sma(values, period) {
    if (values.length < period || period <= 0)
        return NaN;
    const window = values.slice(-period);
    const sum = window.reduce((acc, val) => acc + val, 0);
    return sum / period;
}
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
export function ema(values, period, prevEma) {
    if (values.length === 0 || period <= 0)
        return NaN;
    const multiplier = 2 / (period + 1);
    // If no previous EMA, use SMA as seed
    if (prevEma === undefined || isNaN(prevEma)) {
        if (values.length < period)
            return NaN;
        return sma(values, period);
    }
    // Use the latest value
    const latestValue = values[values.length - 1];
    return (latestValue - prevEma) * multiplier + prevEma;
}
/**
 * Weighted Moving Average (WMA)
 *
 * Recent values have higher weight: weight = index + 1
 *
 * @param values - Array of values
 * @param period - Window size
 * @returns WMA value, or NaN if insufficient data
 */
export function wma(values, period) {
    if (values.length < period || period <= 0)
        return NaN;
    const window = values.slice(-period);
    let weightedSum = 0;
    let weightSum = 0;
    for (let i = 0; i < window.length; i++) {
        const weight = i + 1;
        weightedSum += window[i] * weight;
        weightSum += weight;
    }
    return weightedSum / weightSum;
}
// ============================================================================
// Statistical Measures
// ============================================================================
/**
 * Sample variance
 *
 * @param values - Array of values
 * @param period - Window size
 * @returns Variance, or NaN if insufficient data
 */
export function variance(values, period) {
    if (values.length < period || period <= 1)
        return NaN;
    const window = values.slice(-period);
    const mean = sma(window, period);
    const squaredDiffs = window.map((val) => Math.pow(val - mean, 2));
    const sumSquaredDiffs = squaredDiffs.reduce((acc, val) => acc + val, 0);
    // Sample variance (n-1 denominator)
    return sumSquaredDiffs / (period - 1);
}
/**
 * Sample standard deviation
 *
 * @param values - Array of values
 * @param period - Window size
 * @returns Standard deviation, or NaN if insufficient data
 */
export function stddev(values, period) {
    const v = variance(values, period);
    return isNaN(v) ? NaN : Math.sqrt(v);
}
// ============================================================================
// Volatility Indicators
// ============================================================================
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
export function atr(highs, lows, closes, period) {
    const len = Math.min(highs.length, lows.length, closes.length);
    if (len < period || period <= 0)
        return NaN;
    const trueRanges = [];
    for (let i = 0; i < len; i++) {
        const high = highs[i];
        const low = lows[i];
        const close = closes[i];
        if (i === 0) {
            // First bar: true range = high - low
            trueRanges.push(high - low);
        }
        else {
            const prevClose = closes[i - 1];
            const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
    }
    // ATR is SMA of true ranges
    return sma(trueRanges, period);
}
// ============================================================================
// Momentum Indicators
// ============================================================================
/**
 * Relative Strength Index (RSI)
 *
 * Measures momentum on a scale of 0-100.
 *
 * @param values - Array of prices (typically close)
 * @param period - Window size (typically 14)
 * @returns RSI value [0-100], or NaN if insufficient data
 */
export function rsi(values, period) {
    if (values.length < period + 1 || period <= 0)
        return NaN;
    // Calculate price changes
    const changes = [];
    for (let i = 1; i < values.length; i++) {
        changes.push(values[i] - values[i - 1]);
    }
    // Separate gains and losses
    const window = changes.slice(-period);
    let gains = 0;
    let losses = 0;
    for (const change of window) {
        if (change > 0) {
            gains += change;
        }
        else {
            losses += Math.abs(change);
        }
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    // Avoid division by zero
    if (avgLoss === 0) {
        return avgGain === 0 ? 50 : 100;
    }
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
}
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
export function macd(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const result = { macd: NaN, signal: NaN, histogram: NaN };
    if (values.length < slowPeriod)
        return result;
    // Calculate fast and slow EMAs
    const fastEma = ema(values, fastPeriod);
    const slowEma = ema(values, slowPeriod);
    if (isNaN(fastEma) || isNaN(slowEma))
        return result;
    result.macd = fastEma - slowEma;
    // For signal line, we need MACD history
    // This is a simplified version; for production, maintain MACD history
    const macdHistory = [];
    for (let i = slowPeriod - 1; i < values.length; i++) {
        const slice = values.slice(0, i + 1);
        const fEma = ema(slice, fastPeriod);
        const sEma = ema(slice, slowPeriod);
        if (!isNaN(fEma) && !isNaN(sEma)) {
            macdHistory.push(fEma - sEma);
        }
    }
    if (macdHistory.length >= signalPeriod) {
        result.signal = ema(macdHistory, signalPeriod);
        if (!isNaN(result.signal)) {
            result.histogram = result.macd - result.signal;
        }
    }
    return result;
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Calculate percentage change
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change, or NaN if previous is zero
 */
export function percentChange(current, previous) {
    if (previous === 0)
        return NaN;
    return ((current - previous) / previous) * 100;
}
/**
 * Calculate simple return
 *
 * @param current - Current price
 * @param previous - Previous price
 * @returns Return (not percentage), or NaN if previous is zero
 */
export function simpleReturn(current, previous) {
    if (previous === 0)
        return NaN;
    return (current - previous) / previous;
}
/**
 * Calculate log return
 *
 * @param current - Current price
 * @param previous - Previous price
 * @returns Log return, or NaN if either value is non-positive
 */
export function logReturn(current, previous) {
    if (current <= 0 || previous <= 0)
        return NaN;
    return Math.log(current / previous);
}
