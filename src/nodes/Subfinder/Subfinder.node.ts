import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, commonProperties } from "../../utils/executor";

export class Subfinder implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Subfinder",
		name: "subfinder",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'subfinder' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Subfinder",
		defaults: {
			name: "Subfinder",
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
			const response = await executor.run(idx, "subfinder", "-d", [
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
