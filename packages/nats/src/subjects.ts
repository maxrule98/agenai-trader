// Typed NATS subject helpers for v1 schema
export type Subject =
	| `v1.features.${string}.${string}.${string}`
	| `v1.policy.actions.${string}`
	| `v1.risk.verdicts.${string}`
	| `v1.exec.fills`;

export function subjectFor(type: string, ...args: string[]): Subject {
	switch (type) {
		case "features":
			return `v1.features.${args[0]}.${args[1]}.${args[2]}`;
		case "policy":
			return `v1.policy.actions.${args[0]}`;
		case "risk":
			return `v1.risk.verdicts.${args[0]}`;
		case "fills":
			return "v1.exec.fills";
		default:
			throw new Error(`Unknown subject type: ${type}`);
	}
}
