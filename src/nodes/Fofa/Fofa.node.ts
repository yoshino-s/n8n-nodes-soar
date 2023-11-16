import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
	NodeOperationError,
} from "n8n-workflow";

import { Basic } from "@/common/asset";

export class Fofa implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner Fofa",
		name: "fofa",
		group: ["output"],
		version: 1,
		icon: "file:fofa.svg",
		subtitle: "={{ 'fofa' + $parameter['query'] }}",
		description: "Interact with Fofa",
		defaults: {
			name: "Fofa",
		},
		inputs: ["main"],
		outputs: ["main"],
		credentials: [
			{
				name: "fofaApi",
				required: true,
			},
		],
		properties: [
			{
				displayName: "Query",
				name: "query",
				type: "string",
				default: "",
			},
			{
				displayName: "Page",
				name: "page",
				type: "number",
				default: 1,
			},
			{
				displayName: "Size",
				name: "size",
				type: "number",
				default: 100,
			},
			{
				displayName: "Fields",
				name: "fields",
				type: "string",
				default: "domain,ip,port,host",
			},
			{
				displayName: "Full",
				name: "full",
				type: "boolean",
				default: false,
			},
		],
	};
	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const result: INodeExecutionData[] = [];
		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const query = this.getNodeParameter("query", idx, "") as string;
			const page = this.getNodeParameter("page", idx, 1) as number;
			const size = this.getNodeParameter("size", idx, 100) as number;
			const full = this.getNodeParameter("full", idx, false) as boolean;
			const fields = this.getNodeParameter("fields", idx, "") as string;

			const data: {
				error: boolean;
				errmsg?: string;
				results: string[][];
			} = await this.helpers.httpRequestWithAuthentication.call(
				this,
				"fofaApi",
				{
					method: "GET",
					url: "https://fofa.info/api/v1/search/all",
					qs: {
						qbase64: Buffer.from(query).toString("base64"),
						page,
						size,
						fields,
						full,
					},
				},
			);

			if (data.error && data.errmsg && !data.errmsg.includes("820031")) {
				throw new NodeOperationError(
					this.getNode(),
					new Error(`Fofa error response: ${data.errmsg}`),
				);
			}

			data.results ??= [];

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						data.results
							.map((item) =>
								Array.isArray(item) ? item : [item],
							)
							.map((item) =>
								Object.fromEntries(
									item.map((item, idx) => [
										fields.split(",")[idx],
										item,
									]),
								),
							)
							.map((item) => {
								const basic: Basic = {
									ip: item.ip,
									domain: item.domain,
									port: parseInt(item.port),
									protocol: item.base_protocol as any,
								};

								return {
									basic,
									metadata: {
										...item,
									},
								};
							}),
					),
					{ itemData: { item: idx } },
				),
			);
		}

		return [result];
	}
}
