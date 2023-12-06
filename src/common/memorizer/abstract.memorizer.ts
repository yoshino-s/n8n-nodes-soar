import { IExecuteFunctions, NodeOperationError } from "n8n-workflow";

import { IRunnerData } from "../interface";

export interface MemorizerStorage<T> {
	set(key: string, value: T): Promise<void>;
	get(key: string): Promise<T | null>;
}

export abstract class AbstractMemorizer<T = any> {
	constructor(
		public readonly func: IExecuteFunctions,
		public readonly itemIndex: number,
		public readonly storage: MemorizerStorage<IRunnerData<T>[]>,
	) {}

	abstract hash(data: IRunnerData<T>): string;

	save(input: IRunnerData<T>, output: IRunnerData<T>[]): Promise<void> {
		return this.storage.set(this.hash(input), output);
	}

	async batchSave(
		inputs: IRunnerData<T>[],
		outputs: IRunnerData<T>[][],
	): Promise<void> {
		if (inputs.length !== outputs.length) {
			throw new NodeOperationError(
				this.func.getNode(),
				"Inputs and outputs must be the same length",
			);
		}
		await Promise.all(
			inputs.map((input, index) =>
				this.storage.set(this.hash(input), outputs[index]),
			),
		);
	}

	load(input: IRunnerData<T>): Promise<IRunnerData<T>[] | null> {
		return this.storage.get(this.hash(input));
	}

	async batchLoad(
		inputs: IRunnerData<T>[],
	): Promise<(IRunnerData<T>[] | null)[]> {
		return Promise.all(
			inputs.map((input) => this.storage.get(this.hash(input))),
		);
	}
}
