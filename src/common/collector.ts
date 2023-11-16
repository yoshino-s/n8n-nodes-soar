import { Executor } from "./executor/executor";

export class Collector {
	executor?: Executor;
	constructor() {
		//
	}
	setExecutor(executor: Executor) {
		this.executor = executor;
	}
}
