import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, injectCommonProperties } from "../../utils/executor";

export class Unauthor implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Unauthor",
		name: "unauthor",
		group: ["output"],
		icon: "file:unauthor.svg",
		version: 1,
		subtitle:
			"={{ 'unauthor' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Unauthor",
		defaults: {
			name: "Unauthor",
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
		properties: injectCommonProperties(
			[
				{
					displayName: "Type",
					name: "type",
					type: "options",
					default: "redis",
					options: [
						{
							displayName: "Redis",
							name: "Redis",
							value: "redis",
						},
					],
				},
				{
					displayName: "Options",
					name: "options",
					type: "fixedCollection",
					default: {},
					typeOptions: {
						multipleValues: true,
					},
					options: [
						{
							displayName: "Option",
							name: "option",
							values: [
								{
									displayName: "Options",
									name: "key",
									type: "options",
									default: "--concurrent",
									options: [
										{
											name: "Concurrent",
											value: "--concurrent",
											description:
												"Concurrent number (default 20)",
										},
										{
											name: "Timeout",
											value: "--timeout",
											description:
												"Timeout seconds (default 10s)",
										},
									],
								},
								{
									displayName: "Value",
									name: "value",
									type: "string",
									default: "",
								},
							],
						},
					],
				},
			],
			true
		),
	};
	async execute(
		this: IExecuteFunctions
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const result: INodeExecutionData[] = [];
		const executor = new SoarExecutor(this);
		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const type = this.getNodeParameter("type", idx) as string;
			const response = await executor.run(idx, "unauthor", "--targets", {
				extraArgs: [type],
				extraArgParameters: ["options.option"],
			});

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(JSON.parse(response.stdout)),
					{ itemData: { item: idx } }
				)
			);
		}

		return [result];
	}
}
