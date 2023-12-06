import { AbstractExecutor } from "./executor/abstract.executor";

export class Collector {
	executor?: AbstractExecutor;
	constructor() {
		//
	}
	setExecutor(executor: AbstractExecutor) {
		this.executor = executor;
	}
}
