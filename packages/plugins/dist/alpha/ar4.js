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
import { AlphaSignalSchema } from "@ai-quant/core";
// ============================================================================
// Configuration
// ============================================================================
export const AR4ConfigSchema = z
    .object({
    /** Lookback window for fitting AR(4) model */
    fitWindow: z.number().int().positive().default(100),
    /** Horizon in seconds for signal validity */
    horizonSec: z.number().int().positive().default(300),
    /** Minimum R-squared to emit signal (quality threshold) */
    minRSquared: z.number().min(0).max(1).default(0.1),
})
    .strict();
/**
 * Fit AR(4) model using ordinary least squares
 *
 * @param returns - Array of returns (chronological)
 * @returns Fitted coefficients and R-squared
 */
export function fitAR4(returns) {
    if (returns.length < 10) {
        // Not enough data for meaningful fit
        return {
            beta0: 0,
            beta1: 0,
            beta2: 0,
            beta3: 0,
            beta4: 0,
            rSquared: 0,
        };
    }
    // Prepare design matrix X and target vector y
    // Each row: [1, r_{t-1}, r_{t-2}, r_{t-3}, r_{t-4}]
    // Target: r_t
    const X = [];
    const y = [];
    for (let i = 4; i < returns.length; i++) {
        X.push([1, returns[i - 1], returns[i - 2], returns[i - 3], returns[i - 4]]);
        y.push(returns[i]);
    }
    if (X.length === 0) {
        return {
            beta0: 0,
            beta1: 0,
            beta2: 0,
            beta3: 0,
            beta4: 0,
            rSquared: 0,
        };
    }
    // Solve via normal equations: β = (X'X)^(-1) X'y
    // For simplicity, we use a basic implementation
    // In production, consider using a library like ml-matrix
    const beta = solveOLS(X, y);
    // Compute R-squared
    const yMean = y.reduce((acc, val) => acc + val, 0) / y.length;
    const ssTot = y.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0);
    let ssRes = 0;
    for (let i = 0; i < y.length; i++) {
        const yPred = beta[0] +
            beta[1] * X[i][1] +
            beta[2] * X[i][2] +
            beta[3] * X[i][3] +
            beta[4] * X[i][4];
        ssRes += Math.pow(y[i] - yPred, 2);
    }
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
    return {
        beta0: beta[0],
        beta1: beta[1],
        beta2: beta[2],
        beta3: beta[3],
        beta4: beta[4],
        rSquared: Math.max(0, Math.min(1, rSquared)),
    };
}
/**
 * Solve OLS via normal equations (simplified)
 *
 * β = (X'X)^(-1) X'y
 *
 * @param X - Design matrix
 * @param y - Target vector
 * @returns Coefficient vector
 */
function solveOLS(X, y) {
    const n = X.length;
    const k = X[0].length;
    // Compute X'X
    const XtX = Array.from({ length: k }, () => Array(k).fill(0));
    for (let i = 0; i < k; i++) {
        for (let j = 0; j < k; j++) {
            for (let m = 0; m < n; m++) {
                XtX[i][j] += X[m][i] * X[m][j];
            }
        }
    }
    // Compute X'y
    const Xty = Array(k).fill(0);
    for (let i = 0; i < k; i++) {
        for (let m = 0; m < n; m++) {
            Xty[i] += X[m][i] * y[m];
        }
    }
    // Invert X'X (using Gaussian elimination for 5x5 matrix)
    const XtXInv = invertMatrix(XtX);
    // Compute β = (X'X)^(-1) X'y
    const beta = Array(k).fill(0);
    for (let i = 0; i < k; i++) {
        for (let j = 0; j < k; j++) {
            beta[i] += XtXInv[i][j] * Xty[j];
        }
    }
    return beta;
}
/**
 * Invert a small matrix via Gaussian elimination with partial pivoting
 *
 * @param matrix - Square matrix
 * @returns Inverted matrix, or identity if singular
 */
function invertMatrix(matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
    // Forward elimination
    for (let i = 0; i < n; i++) {
        // Partial pivoting
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        // Check for singularity
        if (Math.abs(augmented[i][i]) < 1e-10) {
            // Return identity (fallback)
            return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
        }
        // Scale pivot row
        const pivot = augmented[i][i];
        for (let j = 0; j < 2 * n; j++) {
            augmented[i][j] /= pivot;
        }
        // Eliminate column
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmented[k][i];
                for (let j = 0; j < 2 * n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
    }
    // Extract inverse from augmented matrix
    return augmented.map((row) => row.slice(n));
}
/**
 * Predict next return using AR(4) model
 *
 * @param coefficients - Fitted AR(4) coefficients
 * @param recentReturns - Last 4 returns [r_{t-1}, r_{t-2}, r_{t-3}, r_{t-4}]
 * @returns Predicted return
 */
export function predictAR4(coefficients, recentReturns) {
    const { beta0, beta1, beta2, beta3, beta4 } = coefficients;
    return (beta0 +
        beta1 * recentReturns[0] +
        beta2 * recentReturns[1] +
        beta3 * recentReturns[2] +
        beta4 * recentReturns[3]);
}
// ============================================================================
// Alpha Plugin
// ============================================================================
/**
 * AR(4) Alpha Plugin State
 *
 * Maintains fitted coefficients and historical returns.
 */
export class AR4Alpha {
    config;
    coefficients = null;
    returnHistory = [];
    constructor(config = AR4ConfigSchema.parse({})) {
        this.config = AR4ConfigSchema.parse(config);
    }
    /**
     * Update model with new features and generate signal
     *
     * @param features - Latest features
     * @returns AlphaSignal or null if no signal
     */
    generateSignal(features) {
        // Extract return from features
        const currentReturn = features.vals.return_1;
        if (currentReturn === undefined || isNaN(currentReturn)) {
            return null;
        }
        // Add to history
        this.returnHistory.push(currentReturn);
        // Limit history to fit window
        if (this.returnHistory.length > this.config.fitWindow) {
            this.returnHistory.shift();
        }
        // Refit model periodically (every 20 bars for efficiency)
        if (this.returnHistory.length % 20 === 0 || this.coefficients === null) {
            this.coefficients = fitAR4(this.returnHistory);
        }
        // Need at least 4 recent returns for prediction
        if (this.returnHistory.length < 4 || this.coefficients === null) {
            return null;
        }
        // Check R-squared threshold
        if (this.coefficients.rSquared < this.config.minRSquared) {
            return null;
        }
        // Get last 4 returns
        const len = this.returnHistory.length;
        const recentReturns = [
            this.returnHistory[len - 1],
            this.returnHistory[len - 2],
            this.returnHistory[len - 3],
            this.returnHistory[len - 4],
        ];
        // Predict next return
        const predictedReturn = predictAR4(this.coefficients, recentReturns);
        // Convert predicted return to signal score [-1, 1]
        // Scale by a factor (e.g., 100) to map typical return magnitudes
        const score = Math.max(-1, Math.min(1, predictedReturn * 100));
        // Confidence is R-squared
        const conf = this.coefficients.rSquared;
        // Build signal
        const signal = {
            id: `ar4-${features.t}`,
            t: features.t,
            symbol: features.symbol,
            exch: features.exch,
            tf: features.tf,
            score,
            conf,
            horizon_sec: this.config.horizonSec,
            explain: `AR(4) predicted return: ${predictedReturn.toFixed(6)}, R²: ${this.coefficients.rSquared.toFixed(3)}`,
        };
        return AlphaSignalSchema.parse(signal);
    }
    /**
     * Get current model coefficients
     */
    getCoefficients() {
        return this.coefficients;
    }
    /**
     * Reset model state
     */
    reset() {
        this.coefficients = null;
        this.returnHistory = [];
    }
}
