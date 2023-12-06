import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { RESOURCES, VulboxApi } from "./api";
import { methods } from "./methods";
import { listProperties, submitProperties } from "./properties";

export class Vulbox implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Vulbox",
		name: "vulbox",
		group: ["output"],
		version: 1,
		subtitle:
			'={{ $parameter["operation"] + ": " + ($parameter["resource"] ?? "Bug") }}',
		icon: "file:vulbox.svg",
		description: "Interact with Vulbox",
		defaults: {
			name: "Vulbox",
		},
		inputs: ["main"],
		outputs: ["main"],
		credentials: [
			{
				name: "vulboxApi",
				required: true,
			},
		],
		properties: [
			{
				displayName: "Operation",
				name: "operation",
				type: "options",
				noDataExpression: true,
				default: "list",
				options: [
					{
						name: "List",
						value: "list",
					},
					{
						name: "Submit",
						value: "submit",
					},
				],
			},
			{
				displayName: "Resource",
				name: "resource",
				type: "options",
				noDataExpression: true,
				default: "bugs/tasks",
				displayOptions: {
					show: {
						operation: ["list"],
					},
				},
				options: [
					{
						name: "Task",
						value: RESOURCES.TASK,
					},
					{
						name: "Vulnerability",
						value: RESOURCES.VULNERABILITY,
					},
					{
						name: "Business",
						value: RESOURCES.BUSINESS,
					},
					{
						name: "VPN",
						value: RESOURCES.VPN,
					},
				],
			},
			...listProperties,
			...submitProperties,
		],
	};

	methods = methods;

	async execute(
		this: IExecuteFunctions,
	): Promise<NodeExecutionWithMetadata[][]> {
		const results: NodeExecutionWithMetadata[] = [];
		const client = new VulboxApi(this);

		for (let i = 0; i < this.getInputData().length; i++) {
			let result: any = {};
			const operation = this.getNodeParameter("operation", i) as string;

			switch (operation) {
				case "list":
					const resource = this.getNodeParameter(
						"resource",
						i,
					) as RESOURCES;
					const full = this.getNodeParameter("full", i) as boolean;

					result = await client.list(resource, full, {
						page: this.getNodeParameter("page", i) as number,
						per_page: this.getNodeParameter(
							"per_page",
							i,
						) as number,
						search_value: this.getNodeParameter(
							"search_value",
							i,
						) as string,
						status: resource === "vulnerability" ? 0 : undefined,
						type:
							resource === "vulnerability"
								? (this.getNodeParameter(
										"vulType",
										i,
								  ) as number)
								: undefined,
					});
					break;
				case "submit":
					result = await client.submitBug({
						task_id: (
							this.getNodeParameter("task", i) as {
								value: number;
							}
						).value,
						bug_title: this.getNodeParameter(
							"bug_title",
							i,
						) as string,
						protocol: true,
						area: (
							this.getNodeParameter("area", i) as string
						).split("/"),
						industry: this.getNodeParameter(
							"industry",
							i,
						) as string,
						industry_category: this.getNodeParameter(
							"industry_category",
							i,
						) as string[],
						bug_display: this.getNodeParameter(
							"bug_display",
							i,
						) as boolean,
						bug_category: this.getNodeParameter(
							"bug_category",
							i,
						) as 1 | 2,
						bug_star: this.getNodeParameter("bug_star", i) as 0 | 1,
						bug_firm_name: JSON.parse(
							(
								this.getNodeParameter("business", i) as {
									value: string;
								}
							).value,
						).bus_name,
						domain: this.getNodeParameter("domain", i) as string,
						bug_type: this.getNodeParameter(
							"bug_type",
							i,
						) as number[],
						bug_level: this.getNodeParameter(
							"bug_level",
							i,
						) as number,
						bug_paper: this.getNodeParameter(
							"bug_paper",
							i,
						) as string,
						bug_star_desc: this.getNodeParameter(
							"bug_star_desc",
							i,
							"",
						) as string,
						bug_url: this.getNodeParameter(
							"bug_url",
							i,
							"",
						) as string,
						bug_parameter: this.getNodeParameter(
							"bug_parameter",
							i,
							"",
						) as string,
						bug_equipment: this.getNodeParameter(
							"bug_equipment",
							i,
							"",
						) as string,
						bug_platform: this.getNodeParameter(
							"bug_platform",
							i,
							"",
						) as string,
						bug_version: this.getNodeParameter(
							"bug_version",
							i,
							"",
						) as string,
						bug_poc: this.getNodeParameter(
							"bug_poc",
							i,
							"",
						) as string,
						repetition_step: this.getNodeParameter(
							"repetition_step",
							i,
						) as string,
						fix_plan: this.getNodeParameter(
							"fix_plan",
							i,
						) as string,
					});
					break;
			}

			results.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(result),
					{
						itemData: {
							item: i,
						},
					},
				),
			);
		}
		return [results];
	}
}
