import { instanceToPlain, plainToInstance } from "class-transformer";
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from "n8n-workflow";

import { Asset } from "@/common/asset";
import { Collector as CollectorClass } from "@/common/collector";
import { NodeConnectionType as CustomNodeConnectionType } from "@/common/connectionType";
import { Executor } from "@/common/executor/executor";
import { Runner } from "@/common/runner/runner";

export class Collector implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Collector",
		name: "collector",
		icon: "fa:link",
		group: ["transform"],
		version: 1,
		description: "A collector to collect all info about site",
		defaults: {
			name: "Collector",
			color: "#D8EF40",
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			NodeConnectionType.Main,
			{
				displayName: "Executor",
				maxConnections: 1,
				type: CustomNodeConnectionType.Executor as any,
				required: true,
			},
			{
				displayName: "Collector",
				type: CustomNodeConnectionType.Runner as any,
				required: false,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Main],
		credentials: [],
		properties: [
			{
				displayName: "Batch",
				name: "batch",
				type: "boolean",
				default: true,
			},
			{
				displayName: "Asset",
				name: "asset",
				type: "json",
				default: "={{ $json }}",
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let assets = this.getInputData().map((n) =>
			plainToInstance(Asset, n.json),
		);

		const batch = this.getNodeParameter("batch", 0) as boolean;

		if (batch) {
			const executor = (await this.getInputConnectionData(
				CustomNodeConnectionType.Executor as any,
				0,
			)) as Executor;
			const collector = new CollectorClass();
			collector.setExecutor(executor);
			let runners = (
				(await this.getInputConnectionData(
					CustomNodeConnectionType.Runner as any,
					0,
				)) as Runner[][]
			).flat();

			runners = runners.sort((a, b) => a.priority - b.priority);

			for (const runner of runners) {
				assets = await runner.run(collector, assets);
			}

			return [
				assets.flatMap((n) => {
					return this.helpers.returnJsonArray(instanceToPlain(n));
				}),
			];
		} else {
			const results: INodeExecutionData[] = [];

			for (let idx = 0; idx < assets.length; idx++) {
				const asset = assets[idx];
				let currentAssets = [asset];
				const executor = (await this.getInputConnectionData(
					CustomNodeConnectionType.Executor as any,
					idx,
				)) as Executor;
				const collector = new CollectorClass();
				collector.setExecutor(executor);
				let runners = (
					(await this.getInputConnectionData(
						CustomNodeConnectionType.Runner as any,
						0,
					)) as Runner[][]
				).flat();

				runners = runners.sort((a, b) => a.priority - b.priority);

				for (const runner of runners) {
					currentAssets = await runner.run(collector, currentAssets);
				}
				results.push(
					...this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(
							currentAssets.map((n) => instanceToPlain(n)),
						),
						{ itemData: { item: idx } },
					),
				);
			}
			return [results];
		}
	}
}
