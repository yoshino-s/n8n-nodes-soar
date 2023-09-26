import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, injectCommonProperties } from "../../utils/executor";

export class Tshark implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Tshark",
		name: "tshark",
		group: ["output"],
		icon: "file:tshark.svg",
		version: 1,
		subtitle: "={{ 'tshark' + $parameter['file'] }}",
		description: "Interact with Tshark",
		defaults: {
			name: "Tshark",
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
					displayName: "File",
					name: "file",
					type: "string",
					default: "",
				},
				{
					displayName: "Filter",
					name: "filter",
					type: "string",
					default: "",
				},
			],
			false
		),
	};
	async execute(
		this: IExecuteFunctions
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const result: INodeExecutionData[] = [];
		const executor = new SoarExecutor(this);
		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const binaryName = this.getNodeParameter("file", idx, "") as string;
			const filter = this.getNodeParameter("filter", idx, "") as string;
			const binaryDataBufferItem = await this.helpers.getBinaryDataBuffer(
				idx,
				binaryName
			);

			const args = ["-r", "/tmp/data.pcap", "-T", "json"];
			if (filter) {
				args.push("-Y", filter);
			}

			const response = await executor.run(idx, "tshark", "", {
				extraArgs: args,
				extraArgParameters: [],
				files: {
					"/tmp/data.pcap": binaryDataBufferItem.toString("base64"),
				},
				image: "registry.yoshino-s.xyz/yoshino-s/soar-image/traffic:dev",
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
