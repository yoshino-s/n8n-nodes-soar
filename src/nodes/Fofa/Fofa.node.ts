import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
	NodeOperationError,
} from "n8n-workflow";

export class Fofa implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Fofa",
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
				name: "fofaCredentialsApi",
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
				default: "host,ip,port",
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
		this: IExecuteFunctions
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
				"fofaCredentialsApi",
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
				}
			);

			console.log(data);
			if (data.error && !data.errmsg.includes("820031")) {
				throw new NodeOperationError(
					this.getNode(),
					`Fofa error response: ${data.errmsg}`
				);
			}

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						data.results.map((item) =>
							Object.fromEntries(
								item.map((item, idx) => [
									fields.split(",")[idx],
									item,
								])
							)
						)
					),
					{ itemData: { item: idx } }
				)
			);
		}

		return [result];
	}
}
