import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from "n8n-workflow";

import { Collector as CollectorClass } from "@/common/collector";
import { NodeConnectionType as CustomNodeConnectionType } from "@/common/connectionType";
import { AbstractExecutor } from "@/common/executor/abstract.executor";
import { IRunnerData } from "@/common/interface";
import { AbstractMemorizer } from "@/common/memorizer/abstract.memorizer";
import { getPriority } from "@/common/runner/decorator";
import { AbstractRunner } from "@/common/runner/runner";

export class Collector implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Collector",
		name: "collector",
		icon: "fa:link",
		group: ["transform"],
		version: 1,
		description: "A collector to collect all info about assets",
		defaults: {
			name: "Collector",
			color: "#D8EF40",
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			NodeConnectionType.Main,
			{
				displayName: "Executor",
				type: CustomNodeConnectionType.Executor as any,
				required: true,
				maxConnections: 1,
			},
			{
				displayName: "Memorizer",
				type: CustomNodeConnectionType.Memorizer as any,
				required: false,
				maxConnections: 1,
			},
			{
				displayName: "Collector",
				type: CustomNodeConnectionType.Runner as any,
				required: false,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: "Asset",
				name: "asset",
				type: "json",
				default: "={{ $json }}",
			},
			{
				displayName: "Ignore Memorized Data",
				name: "ignoreMemorizedData",
				type: "boolean",
				default: false,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputs = this.getInputData();

		const collector = new CollectorClass();

		const run = async <T = any>(
			inputs: IRunnerData<T>[],
			idx: number,
		): Promise<IRunnerData<T>[]> => {
			const outputs: IRunnerData<T>[] = [];

			const executor = (await this.getInputConnectionData(
				CustomNodeConnectionType.Executor as any,
				idx,
			)) as AbstractExecutor;

			collector.setExecutor(executor);

			const memorizer = (await this.getInputConnectionData(
				CustomNodeConnectionType.Memorizer as any,
				idx,
			)) as AbstractMemorizer | undefined;
			const ignoreMemorizedData = this.getNodeParameter(
				"ignoreMemorizedData",
				idx,
			);

			if (memorizer) {
				const cachedOutput = await memorizer.batchLoad(inputs);
				inputs = inputs.filter((i, idx) => !cachedOutput[idx]);
				if (!ignoreMemorizedData) {
					outputs.push(
						...(
							cachedOutput.filter(
								(o) => o !== null,
							) as unknown[] as IRunnerData<T>[][]
						).flat(),
					);
				}
				inputs.forEach((i, idx) => {
					i.sourceInputIndex = idx;
				});
			}

			if (inputs.length !== 0) {
				let runners = (
					(await this.getInputConnectionData(
						CustomNodeConnectionType.Runner as any,
						idx,
					)) as AbstractRunner[][]
				).flat();

				runners = runners.sort(
					(a, b) => getPriority(b) - getPriority(a),
				);

				let runOutputs = inputs;
				for (const runner of runners) {
					runOutputs = await runner.run(collector, runOutputs);
				}

				if (memorizer) {
					const paired: IRunnerData<T>[][] = inputs.map(() => []);
					for (const output of runOutputs) {
						if (output.sourceInputIndex !== -1) {
							console.log(output);
							paired[output.sourceInputIndex].push(output);
						}
					}
					await memorizer.batchSave(inputs, paired);
				}

				outputs.push(...runOutputs);
			}

			return outputs;
		};

		return [
			this.helpers.returnJsonArray(
				(await run(
					inputs.map((n, idx) => ({
						json: n.json,
						binary: n.binary,
						sourceInputIndex: idx,
					})),
					0,
				)) as any,
			),
		];
	}
}
