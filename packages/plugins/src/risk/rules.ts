// Pure, deterministic risk rules for trading
import { z } from "zod";

export const RiskVerdictSchema = z.object({
	allow: z.boolean(),
	reason: z.string().optional(),
	adjusted: z.any().optional(),
});
export type RiskVerdict = z.infer<typeof RiskVerdictSchema>;

export interface RiskContext {
	symbol: string;
	exch: string;
	pnl: number;
	exposure: number;
	maxDailyLoss: number;
	maxExposure: number;
	leverage: number;
	maxLeverage: number;
	feedStale: boolean;
}

export function maxDailyLossRule(ctx: RiskContext): RiskVerdict {
	if (ctx.pnl < -ctx.maxDailyLoss) {
		return { allow: false, reason: "max daily loss" };
	}
	return { allow: true };
}

export function maxExposureRule(ctx: RiskContext): RiskVerdict {
	if (ctx.exposure > ctx.maxExposure) {
		return { allow: false, reason: "max exposure" };
	}
	return { allow: true };
}

export function leverageCapRule(ctx: RiskContext): RiskVerdict {
	if (ctx.leverage > ctx.maxLeverage) {
		return { allow: false, reason: "leverage cap" };
	}
	return { allow: true };
}

export function staleFeedRule(ctx: RiskContext): RiskVerdict {
	if (ctx.feedStale) {
		return { allow: false, reason: "stale feed" };
	}
	return { allow: true };
}
