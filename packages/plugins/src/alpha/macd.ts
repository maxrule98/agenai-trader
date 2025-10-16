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
import { Features, AlphaSignal, AlphaSignalSchema } from "@ai-quant/core";

// ============================================================================
// Configuration
// ============================================================================

export const MACDConfigSchema = z
	.object({
		/** Minimum histogram magnitude to emit signal (noise filter) */
		minHistogram: z.number().nonnegative().default(0.0001),
		/** Horizon in seconds for signal validity */
		horizonSec: z.number().int().positive().default(300),
		/** Use crossover detection (vs histogram-only) */
		useCrossover: z.boolean().default(true),
	})
	.strict();

export type MACDConfig = z.infer<typeof MACDConfigSchema>;

// ============================================================================
// MACD State
// ============================================================================

interface MACDState {
	/** Previous MACD value */
	prevMacd: number | null;
	/** Previous signal line value */
	prevSignal: number | null;
	/** Previous histogram value */
	prevHistogram: number | null;
}

// ============================================================================
// Alpha Plugin
// ============================================================================

/**
 * MACD Alpha Plugin
 *
 * Maintains state for crossover detection.
 */
export class MACDAlpha {
	private config: MACDConfig;
	private state: MACDState = {
		prevMacd: null,
		prevSignal: null,
		prevHistogram: null,
	};

	constructor(config: MACDConfig = MACDConfigSchema.parse({})) {
		this.config = MACDConfigSchema.parse(config);
	}

	/**
	 * Generate signal from features
	 *
	 * @param features - Latest features (must include macd, macd_signal, macd_histogram)
	 * @returns AlphaSignal or null
	 */
	generateSignal(features: Features): AlphaSignal | null {
		// Extract MACD values from features
		const macd = features.vals.macd;
		const signal = features.vals.macd_signal;
		const histogram = features.vals.macd_histogram;

		// Validate MACD values
		if (
			macd === undefined ||
			signal === undefined ||
			histogram === undefined ||
			isNaN(macd) ||
			isNaN(signal) ||
			isNaN(histogram)
		) {
			return null;
		}

		// Check minimum histogram threshold
		if (Math.abs(histogram) < this.config.minHistogram) {
			// Update state and skip signal
			this.updateState(macd, signal, histogram);
			return null;
		}

		let score = 0;
		let conf = 0;
		let explain = "";

		if (this.config.useCrossover && this.state.prevMacd !== null) {
			// Detect crossover
			const crossover = this.detectCrossover(macd, signal);

			if (crossover === "bullish") {
				score = 1;
				conf = 0.8;
				explain = "MACD bullish crossover detected";
			} else if (crossover === "bearish") {
				score = -1;
				conf = 0.8;
				explain = "MACD bearish crossover detected";
			} else {
				// No crossover, use histogram-based signal
				const histogramSignal = this.computeHistogramSignal(histogram);
				score = histogramSignal.score;
				conf = histogramSignal.conf;
				explain = histogramSignal.explain;
			}
		} else {
			// Histogram-only mode
			const histogramSignal = this.computeHistogramSignal(histogram);
			score = histogramSignal.score;
			conf = histogramSignal.conf;
			explain = histogramSignal.explain;
		}

		// Update state
		this.updateState(macd, signal, histogram);

		// Return null if no meaningful signal
		if (score === 0 || conf === 0) {
			return null;
		}

		// Build signal
		const alphaSignal: AlphaSignal = {
			id: `macd-${features.t}`,
			t: features.t,
			symbol: features.symbol,
			exch: features.exch,
			tf: features.tf,
			score,
			conf,
			horizon_sec: this.config.horizonSec,
			explain,
		};

		return AlphaSignalSchema.parse(alphaSignal);
	}

	/**
	 * Detect MACD crossover
	 *
	 * @param macd - Current MACD value
	 * @param signal - Current signal line value
	 * @returns 'bullish', 'bearish', or null
	 */
	private detectCrossover(
		macd: number,
		signal: number
	): "bullish" | "bearish" | null {
		if (this.state.prevMacd === null || this.state.prevSignal === null) {
			return null;
		}

		const wasBelowSignal = this.state.prevMacd < this.state.prevSignal;
		const isAboveSignal = macd > signal;

		if (wasBelowSignal && isAboveSignal) {
			return "bullish";
		}

		const wasAboveSignal = this.state.prevMacd > this.state.prevSignal;
		const isBelowSignal = macd < signal;

		if (wasAboveSignal && isBelowSignal) {
			return "bearish";
		}

		return null;
	}

	/**
	 * Compute signal from histogram
	 *
	 * @param histogram - MACD histogram value
	 * @returns Signal with score, confidence, and explanation
	 */
	private computeHistogramSignal(histogram: number): {
		score: number;
		conf: number;
		explain: string;
	} {
		// Histogram > 0: bullish, < 0: bearish
		const direction = histogram > 0 ? 1 : -1;

		// Check if histogram is increasing (momentum strengthening)
		let momentumStrength = 0.5; // Default
		if (this.state.prevHistogram !== null) {
			const histogramChange = histogram - this.state.prevHistogram;
			if (
				(direction > 0 && histogramChange > 0) ||
				(direction < 0 && histogramChange < 0)
			) {
				momentumStrength = 0.7; // Strengthening
			} else {
				momentumStrength = 0.3; // Weakening
			}
		}

		// Score proportional to histogram (clamped to [-1, 1])
		// Scale by 1000 for typical MACD histogram values
		// histogram already has the sign, so no need to multiply by direction
		const score = Math.max(-1, Math.min(1, histogram * 1000));

		const conf = momentumStrength;

		const explain =
			direction > 0
				? `MACD histogram positive (${histogram.toFixed(6)}), momentum ${
						momentumStrength > 0.5 ? "strengthening" : "weakening"
				  }`
				: `MACD histogram negative (${histogram.toFixed(6)}), momentum ${
						momentumStrength > 0.5 ? "strengthening" : "weakening"
				  }`;

		return { score, conf, explain };
	}

	/**
	 * Update internal state
	 */
	private updateState(macd: number, signal: number, histogram: number): void {
		this.state.prevMacd = macd;
		this.state.prevSignal = signal;
		this.state.prevHistogram = histogram;
	}

	/**
	 * Reset plugin state
	 */
	reset(): void {
		this.state = {
			prevMacd: null,
			prevSignal: null,
			prevHistogram: null,
		};
	}

	/**
	 * Get current state (for debugging/testing)
	 */
	getState(): MACDState {
		return { ...this.state };
	}
}
