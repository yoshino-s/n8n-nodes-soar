import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, commonProperties } from "../../utils/executor";

export class Katana implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Katana",
		name: "katana",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'katana' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Katana",
		defaults: {
			name: "Katana",
		},
		inputs: ["main"],
		outputs: ["main"],
		credentials: [
			{
				name: "dockerCredentialsApi",
			},
			{
				name: "kubernetesCredentialsApi",
			},
		],
		properties: [...commonProperties],
	};
	async execute(
		this: IExecuteFunctions
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const result: INodeExecutionData[] = [];
		const executor = new SoarExecutor(this);
		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const response = await executor.run(idx, "katana", "-u", [
				"-silent",
				"-duc",
			]);

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						response.stdout
							.trim()
							.split("\n")
							.map((n) => ({
								url: n,
							}))
					),
					{ itemData: { item: idx } }
				)
			);
		}

		return [result];
	}
}
