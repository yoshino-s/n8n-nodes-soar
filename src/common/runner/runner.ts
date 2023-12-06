import { IExecuteFunctions } from "n8n-workflow";

import { Collector } from "../collector";
import { IRunnerData, MaybePromise } from "../interface";

export abstract class AbstractRunner<T = any> {
	constructor(
		public readonly func: IExecuteFunctions,
		public readonly itemIndex: number,
	) {}

	abstract run(
		collector: Collector,
		inputs: IRunnerData<T>[],
	): MaybePromise<IRunnerData<T>[]>;

	constructData(
		sourceInputIndex: number,
		d: T[],
		success = false,
	): IRunnerData<T>[] {
		return d.map((a) => ({
			json: a,
			success,
			sourceInputIndex,
		}));
	}
}
