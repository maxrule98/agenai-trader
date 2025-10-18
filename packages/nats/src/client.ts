import { Subject } from "./subjects";

export interface Bus {
	publish<T>(subject: Subject, payload: T): Promise<void>;
	subscribe<T>(
		subject: Subject,
		handler: (msg: T) => void
	): Promise<() => void>;
}

export class MemoryBus implements Bus {
	private subs: Map<Subject, Array<(msg: any) => void>> = new Map();
	async publish<T>(subject: Subject, payload: T) {
		(this.subs.get(subject) || []).forEach((h) => h(payload));
	}
	async subscribe<T>(subject: Subject, handler: (msg: T) => void) {
		if (!this.subs.has(subject)) this.subs.set(subject, []);
		this.subs.get(subject)!.push(handler);
		return async () => {
			const arr = this.subs.get(subject)!;
			this.subs.set(
				subject,
				arr.filter((h) => h !== handler)
			);
		};
	}
}
