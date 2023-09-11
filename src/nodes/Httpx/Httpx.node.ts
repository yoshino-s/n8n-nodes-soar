import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, commonProperties } from "../../utils/executor";

export class Httpx implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Httpx",
		name: "httpx",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'httpx' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Httpx",
		defaults: {
			name: "Httpx",
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
			const response = await executor.run(idx, "httpx", "-u", [
				"-silent",
				"-duc",
				"-json",
			]);

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						response.stdout
							.trim()
							.split("\n")
							.map((n) => {
								const d = JSON.parse(n);
								delete d.timestamp;
								return d;
							})
							.map(({ url, ...metadata }) => ({
								url,
								metadata,
							}))
					),
					{ itemData: { item: idx } }
				)
			);
		}

		return [result];
	}
}
