/**
 * @file packages/plugins/src/alpha/ar4.ts
 *
 * AR(4) Autoregressive Alpha Plugin
 *
 * Predicts next return using the last 4 returns with fitted coefficients.
 * This is a simple baseline alpha for mean-reversion strategies.
 *
 * Assumptions:
 * - Returns are computed from features
 * - Coefficients are estimated via ordinary least squares (OLS)
 * - Model is re-fit periodically on a rolling window
 * - Signal confidence is based on R-squared of the fit
 *
 * Math:
 *   r_t = β₀ + β₁·r_{t-1} + β₂·r_{t-2} + β₃·r_{t-3} + β₄·r_{t-4} + ε_t
 */
import { z } from "zod";
import { Features, AlphaSignal } from "@ai-quant/core";
export declare const AR4ConfigSchema: z.ZodObject<{
    /** Lookback window for fitting AR(4) model */
    fitWindow: z.ZodDefault<z.ZodNumber>;
    /** Horizon in seconds for signal validity */
    horizonSec: z.ZodDefault<z.ZodNumber>;
    /** Minimum R-squared to emit signal (quality threshold) */
    minRSquared: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    fitWindow: number;
    horizonSec: number;
    minRSquared: number;
}, {
    fitWindow?: number | undefined;
    horizonSec?: number | undefined;
    minRSquared?: number | undefined;
}>;
export type AR4Config = z.infer<typeof AR4ConfigSchema>;
/**
 * AR(4) model coefficients
 */
export interface AR4Coefficients {
    /** Intercept */
    beta0: number;
    /** Lag-1 coefficient */
    beta1: number;
    /** Lag-2 coefficient */
    beta2: number;
    /** Lag-3 coefficient */
    beta3: number;
    /** Lag-4 coefficient */
    beta4: number;
    /** R-squared (goodness of fit) */
    rSquared: number;
}
/**
 * Fit AR(4) model using ordinary least squares
 *
 * @param returns - Array of returns (chronological)
 * @returns Fitted coefficients and R-squared
 */
export declare function fitAR4(returns: number[]): AR4Coefficients;
/**
 * Predict next return using AR(4) model
 *
 * @param coefficients - Fitted AR(4) coefficients
 * @param recentReturns - Last 4 returns [r_{t-1}, r_{t-2}, r_{t-3}, r_{t-4}]
 * @returns Predicted return
 */
export declare function predictAR4(coefficients: AR4Coefficients, recentReturns: [number, number, number, number]): number;
/**
 * AR(4) Alpha Plugin State
 *
 * Maintains fitted coefficients and historical returns.
 */
export declare class AR4Alpha {
    private config;
    private coefficients;
    private returnHistory;
    constructor(config?: AR4Config);
    /**
     * Update model with new features and generate signal
     *
     * @param features - Latest features
     * @returns AlphaSignal or null if no signal
     */
    generateSignal(features: Features): AlphaSignal | null;
    /**
     * Get current model coefficients
     */
    getCoefficients(): AR4Coefficients | null;
    /**
     * Reset model state
     */
    reset(): void;
}
//# sourceMappingURL=ar4.d.ts.map