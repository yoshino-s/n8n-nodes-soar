import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, injectCommonProperties } from "../../utils/executor";

export class Cdncheck implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Cdncheck",
		name: "cdncheck",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'cdncheck' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Cdncheck",
		defaults: {
			name: "Cdncheck",
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
		properties: injectCommonProperties([
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
						displayName: "Detection",
						name: "detection",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-cdn",
								options: [
									{
										name: "CDN",
										value: "-cdn",
										description:
											"Display only cdn in cli output",
									},
									{
										name: "Cloud",
										value: "-cloud",
										description:
											"Display only cloud in cli output",
									},
									{
										name: "Waf",
										value: "-waf",
										description:
											"Display only waf in cli output",
									},
								],
							},
						],
					},
					{
						displayName: "Matcher",
						name: "matcher",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-match-cdn",
								options: [
									{
										name: "Match CDN",
										value: "-match-cdn",
										description:
											"Match host with specified cdn provider (cloudfront, fastly, google, leaseweb, stackpath) (string[])",
									},
									{
										name: "Match Cloud",
										value: "-match-cloud",
										description:
											"Match host with specified cloud provider (zscaler, aws, azure, google, office365, oracle) (string[])",
									},
									{
										name: "Match Waf",
										value: "-match-waf",
										description:
											"Match host with specified waf provider (akamai, cloudflare, incapsula, sucuri) (string[])",
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
					{
						displayName: "Filter",
						name: "filter",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-filter-cdn",
								options: [
									{
										name: "Filter CDN",
										value: "-filter-cdn",
										description:
											"Filter host with specified cdn provider (cloudfront, fastly, google, leaseweb, stackpath) (string[])",
									},
									{
										name: "Filter Cloud",
										value: "-filter-cloud",
										description:
											"Filter host with specified cloud provider (zscaler, aws, azure, google, office365, oracle) (string[])",
									},
									{
										name: "Filter Waf",
										value: "-filter-waf",
										description:
											"Filter host with specified waf provider (akamai, cloudflare, incapsula, sucuri) (string[])",
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
					{
						displayName: "Config",
						name: "config",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-resolver",
								options: [
									{
										name: "Resolver",
										value: "-resolver",
										description:
											"List of resolvers to use (file or comma-separated) (string[])",
									},
									{
										name: "Exclude",
										value: "-exclude",
										description:
											"Exclude detected ip from output",
									},
									{
										name: "Retry",
										value: "-retry",
										description:
											"Maximum number of retries for dns resolution (must be at least 1) (default 2) (int)",
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
		]),
	};
	async execute(
		this: IExecuteFunctions
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const result: INodeExecutionData[] = [];
		const executor = new SoarExecutor(this);
		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const response = await executor.run(idx, "cdncheck", "-input", {
				extraArgs: ["-jsonl", "-silent", "-disable-update-check"],
				extraArgParameters: [
					"options.detection",
					"options.matcher",
					"options.filter",
					"options.config",
				],
			});

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						((d) =>
							d
								.split("\n")
								.map((n) => n.trim())
								.filter(Boolean)
								.map((d) => JSON.parse(d)))(response.stdout)
					),
					{ itemData: { item: idx } }
				)
			);
		}

		return [result];
	}
}
