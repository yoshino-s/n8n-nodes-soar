import { IExecuteFunctions } from "n8n-workflow";

import { NodeConnectionType } from "../connectionType";

export interface ExecutorResult<T extends string = string> {
	stdout: string;
	stderr: string;
	error: string;
	files: Record<T, string>;
}

export abstract class Executor {
	constructor(protected readonly func: IExecuteFunctions) {}

	abstract __run<T extends string = string>(
		cmd: string[],
		image: string,
		env?: Record<string, string>
	): Promise<ExecutorResult<T>>;

	async run<T extends string = string>(
		cmd: string[],
		image: string,
		env?: Record<string, string>
	): Promise<ExecutorResult<T>> {
		const { index } = this.func.addInputData(
			NodeConnectionType.Executor as any,
			[
				[
					{
						json: {
							cmd,
							image,
							env,
						},
					},
				],
			]
		);

		const resp = await this.__run(cmd, image, env);

		this.func.addOutputData(NodeConnectionType.Executor as any, index, [
			this.func.helpers.returnJsonArray(resp as any),
		]);

		return resp;
	}
}
