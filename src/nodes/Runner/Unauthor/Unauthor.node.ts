import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset } from "@/common/asset";
import { NodeConnectionType } from "@/common/connectionType";
import { ContainerRunner } from "@/common/runner/container.runner";
import { APP_RUNNER_PRIORITY } from "@/common/runner/priority";

class UnauthorRunner extends ContainerRunner {
	public cmd(assets: Asset[]): string[] {
		const type = this.func.getNodeParameter(
			"type",
			this.itemIndex
		) as string;
		return [
			"unauthor",
			"--type",
			type,
			"-t",
			assets.map((a) => a.getHostAndPort()).join(","),
			...this.collectGeneratedOptions(["options.option"]),
		];
	}

	public process(rawAssets: Asset[], stdout: string): Asset[] {
		const result = new Map<string, any>();
		for (const line of stdout.trim().split("\n")) {
			const json = JSON.parse(line);
			result.set(json.target, json);
		}
		return rawAssets.map((a) => {
			const res = result.get(a.getHostAndPort());
			if (res) {
				a.response = res;
				a.success = res.success;
			}
			return a;
		});
	}
}

export class Unauthor implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Unauthor",
		name: "unauthor",
		icon: "fa:key",
		group: ["transform"],
		codex: {
			alias: ["Unauthor"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
			resources: {
				primaryDocumentation: [
					{
						url: "https://github.com/yoshino-s/unauthor",
					},
				],
			},
		},
		version: 1,
		description:
			"Interact with Unauthor, find unauthorized access to assets",
		defaults: {
			name: "Unauthor",
		},
		subtitle: '={{$parameter["type"]}}',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Runner] as any,
		properties: [
			{
				displayName: "Only Success",
				name: "onlySuccess",
				type: "boolean",
				default: true,
			},
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
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number
	): Promise<SupplyData> {
		return {
			response: [
				new UnauthorRunner(
					"unauthor",
					APP_RUNNER_PRIORITY,
					this,
					itemIndex
				),
			],
		};
	}
}
