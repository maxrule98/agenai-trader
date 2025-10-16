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
import { AlphaSignalSchema, FeaturesSchema, ActionSchema, } from "@ai-quant/core";
// ============================================================================
// Configuration
// ============================================================================
export const ThresholdAtrConfigSchema = z
    .object({
    /** Threshold to enter position (|score| must exceed this) */
    enterThreshold: z.number().min(0).max(1).default(0.5),
    /** Threshold to exit position (|score| drops below this) */
    exitThreshold: z.number().min(0).max(1).default(0.3),
    /** Fixed notional per trade (in quote currency) */
    fixedNotional: z.number().positive().default(1000),
    /** Use ATR-based sizing (overrides fixedNotional if true) */
    useAtrSizing: z.boolean().default(false),
    /** ATR multiplier for position sizing (if useAtrSizing=true) */
    atrSizingMultiplier: z.number().positive().default(1.0),
    /** ATR multiplier for take-profit */
    atrTpMultiplier: z.number().positive().default(2.0),
    /** ATR multiplier for stop-loss */
    atrSlMultiplier: z.number().positive().default(1.0),
    /** Maximum position size (absolute, in base currency) */
    maxSize: z.number().positive().default(10),
})
    .strict();
// ============================================================================
// Policy Plugin
// ============================================================================
/**
 * Threshold-ATR Policy Plugin
 *
 * Maintains position state and generates Actions from AlphaSignals.
 */
export class ThresholdAtrPolicy {
    config;
    state = {
        side: null,
        size: 0,
    };
    constructor(config = ThresholdAtrConfigSchema.parse({})) {
        this.config = ThresholdAtrConfigSchema.parse(config);
        // Validate: enter threshold >= exit threshold
        if (this.config.enterThreshold < this.config.exitThreshold) {
            throw new Error("enterThreshold must be >= exitThreshold for proper hysteresis");
        }
    }
    /**
     * Generate Action from AlphaSignal and Features
     *
     * @param signal - Alpha signal
     * @param features - Current market features (must include atr_14 and close)
     * @returns Action or null
     */
    generateAction(signal, features) {
        // Validate inputs
        AlphaSignalSchema.parse(signal);
        FeaturesSchema.parse(features);
        const atr = features.vals.atr_14;
        const currentPrice = features.vals.close;
        if (atr === undefined || currentPrice === undefined || isNaN(atr) || isNaN(currentPrice)) {
            return null;
        }
        const absScore = Math.abs(signal.score);
        const direction = signal.score > 0 ? "buy" : "sell";
        // Determine action based on current state and hysteresis
        if (this.state.side === null) {
            // Flat: check if signal exceeds enter threshold
            if (absScore >= this.config.enterThreshold) {
                return this.buildOpenAction(signal, features, currentPrice, atr, direction);
            }
            return null;
        }
        else {
            // In position: check for exit or reversal
            const currentDirection = this.state.side === "buy" ? "buy" : "sell";
            // If signal reverses and exceeds enter threshold, reverse position
            if (direction !== currentDirection && absScore >= this.config.enterThreshold) {
                // Close current, open new
                const closeAction = this.buildCloseAction(signal, features, currentPrice);
                // Note: In production, we'd emit closeAction first, then openAction in sequence
                // For now, we'll return the reversal open action and update state
                this.state.side = null;
                this.state.size = 0;
                return this.buildOpenAction(signal, features, currentPrice, atr, direction);
            }
            // If signal weakens below exit threshold, close
            if (absScore < this.config.exitThreshold) {
                return this.buildCloseAction(signal, features, currentPrice);
            }
            // Hold position (no action)
            return null;
        }
    }
    /**
     * Build Action to open new position
     */
    buildOpenAction(signal, features, currentPrice, atr, direction) {
        const side = direction;
        // Compute position size
        let size;
        if (this.config.useAtrSizing) {
            // Size based on ATR: fixedNotional / (ATR * multiplier)
            const riskAmount = atr * this.config.atrSizingMultiplier;
            size = this.config.fixedNotional / (currentPrice * riskAmount);
        }
        else {
            // Fixed notional sizing
            size = this.config.fixedNotional / currentPrice;
        }
        // Clamp to max size
        size = Math.min(size, this.config.maxSize);
        // Compute bracket (TP/SL)
        const bracket = this.computeBracket(currentPrice, atr, side);
        // Update state
        this.state.side = side;
        this.state.size = size;
        const action = {
            t: signal.t,
            symbol: signal.symbol,
            exch: signal.exch,
            side,
            size,
            bracket,
            metadata: {
                signalId: signal.id,
                signalScore: signal.score,
                signalConf: signal.conf,
                atr,
            },
        };
        return ActionSchema.parse(action);
    }
    /**
     * Build Action to close existing position
     */
    buildCloseAction(signal, _features, currentPrice) {
        if (this.state.side === null || this.state.size === 0) {
            throw new Error("Cannot close position: already flat");
        }
        // Close is opposite side
        const closeSide = this.state.side === "buy" ? "sell" : "buy";
        const closeSize = this.state.size;
        // Update state to flat
        this.state.side = null;
        this.state.size = 0;
        const action = {
            t: signal.t,
            symbol: signal.symbol,
            exch: signal.exch,
            side: closeSide,
            size: closeSize,
            entry: currentPrice, // Market order at current price
            metadata: {
                signalId: signal.id,
                reason: "exit_threshold",
            },
        };
        return ActionSchema.parse(action);
    }
    /**
     * Compute bracket orders (TP/SL) based on ATR
     *
     * @param entryPrice - Entry price
     * @param atr - ATR value
     * @param side - Position side
     * @returns Bracket configuration
     */
    computeBracket(entryPrice, atr, side) {
        const tpDistance = atr * this.config.atrTpMultiplier;
        const slDistance = atr * this.config.atrSlMultiplier;
        if (side === "buy") {
            return {
                tp: entryPrice + tpDistance,
                sl: entryPrice - slDistance,
            };
        }
        else {
            return {
                tp: entryPrice - tpDistance,
                sl: entryPrice + slDistance,
            };
        }
    }
    /**
     * Get current policy state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Reset policy state
     */
    reset() {
        this.state = {
            side: null,
            size: 0,
        };
    }
    /**
     * Check if currently in a position
     */
    isFlat() {
        return this.state.side === null;
    }
}
