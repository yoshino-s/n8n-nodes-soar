import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset } from "@/common/asset";
import { Collector } from "@/common/collector";
import { NodeConnectionType } from "@/common/connectionType";
import { IRunnerData } from "@/common/interface";
import { proxyRunner } from "@/common/proxy/runner.proxy";
import {
	ContainerRunner,
	advancedOptions,
} from "@/common/runner/container.runner";
import {
	AssetRunner,
	EXPLOIT_RUNNER_PRIORITY,
	Priority,
} from "@/common/runner/decorator";

@Priority(EXPLOIT_RUNNER_PRIORITY)
@AssetRunner
class UnauthorRunner extends ContainerRunner<Asset> {
	async run(
		collector: Collector,
		inputs: IRunnerData<Asset>[],
	): Promise<IRunnerData<Asset>[]> {
		const assets = inputs.map((n) => n.json);
		const type = this.func.getNodeParameter(
			"type",
			this.itemIndex,
		) as string;
		const cmd = [
			"unauthor",
			"--type",
			type,
			"-t",
			assets.map((a) => a.getHostAndPort()).join(","),
			...this.collectGeneratedCmdOptions(["options.option"]),
		];

		const { stdout } = await this.runCmd(collector, cmd, this.getOptions());

		const result = new Map<string, any>();
		for (const json of stdout
			.trim()
			.split("\n")
			.filter(Boolean)
			.map((n) => JSON.parse(n))) {
			result.set(json.target, json);
		}
		return inputs.map((a) => {
			const res = result.get(a.json.getHostAndPort());
			if (res) {
				a.json.response = res;
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
			...advancedOptions,
			{
				displayName: "Debug Mode",
				name: "debug",
				type: "boolean",
				default: false,
				description:
					"Whether open to see more information in node input & output",
			},
		],
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		return {
			response: [proxyRunner(new UnauthorRunner(this, itemIndex))],
		};
	}
}
