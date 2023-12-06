import { Collector } from "../collector";
import { IRunnerData } from "../interface";

import { Priority } from "./decorator";
import { AbstractRunner } from "./runner";

export class PriorityRunner<T> extends AbstractRunner<T> {
	constructor(
		readonly parentRunner: AbstractRunner<T>,
		priority: number,
	) {
		super(parentRunner.func, parentRunner.itemIndex);
		Priority(priority)(this.constructor);
	}

	async run(
		collector: Collector,
		inputs: IRunnerData<T>[],
	): Promise<IRunnerData<T>[]> {
		// bypass set input/output in priority runner node
		return this.parentRunner.run(collector, inputs);
	}
}
