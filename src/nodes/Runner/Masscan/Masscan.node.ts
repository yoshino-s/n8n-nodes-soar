import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset, Ports } from "@/common/asset";
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
	PORT_RUNNER_PRIORITY,
	Priority,
} from "@/common/runner/decorator";

@Priority(PORT_RUNNER_PRIORITY)
@AssetRunner
class MasscanRunner extends ContainerRunner<Asset> {
	async run(
		collector: Collector,
		inputs: IRunnerData<Asset>[],
	): Promise<IRunnerData<Asset>[]> {
		const assets = inputs.map((n) => n.json);
		const outputFileName = `/tmp/${this.func.getNode().id}.json`;
		const rateLimit = this.func.getNodeParameter(
			"rateLimit",
			this.itemIndex,
		) as number;
		const connectionTimeout = this.func.getNodeParameter(
			"connectionTimeout",
			this.itemIndex,
		) as number;
		const ports = this.func.getNodeParameter(
			"ports",
			this.itemIndex,
		) as string;
		const bannerGrabbing = this.func.getNodeParameter(
			"bannerGrabbing",
			this.itemIndex,
		) as boolean;

		const cmd = [
			"masscan",
			"-oJ",
			outputFileName,
			"--max-rate",
			rateLimit.toString(),
			"--connection-timeout",
			connectionTimeout.toString(),
			"--ports",
			ports,
			...(bannerGrabbing ? ["--banners"] : []),
			...new Set(assets.map((n) => n.getIP())),
		];

		const options = this.getOptions();
		options.ignoreStdout = true;
		options.ignoreStderr = true;
		options.collectFiles.push(outputFileName);

		const { files } = await this.runCmd(collector, cmd, options);

		const raw = JSON.parse(files[outputFileName] + "]") as Array<{
			ip: string;
			ports: Array<{
				port: number;
				protocol: "tcp" | "udp";
			}>;
		}>;

		const portsResult = new Map<string, Ports>();
		raw.forEach((n) => {
			const ports_ = portsResult.get(n.ip) ?? [];
			ports_.push(...n.ports);
			portsResult.set(n.ip, ports_);
		});

		return inputs.flatMap((a) => {
			const result = portsResult.get(a.json.getIP());
			if (result) {
				return this.constructData(
					a.sourceInputIndex,
					a.json.splitByPorts(result),
					true,
				);
			} else {
				return a;
			}
		});
	}
}

export class Masscan implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Masscan",
		name: "masscan",
		icon: "file:masscan.svg",
		group: ["transform"],
		version: 1,
		codex: {
			alias: ["Masscan"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
			resources: {
				primaryDocumentation: [
					{
						url: "https://github.com/robertdavidgraham/masscan",
					},
				],
			},
		},
		description: "Interact with Masscan",
		defaults: {
			name: "Masscan",
		},
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
				displayName: "Ports",
				name: "ports",
				type: "string",
				default: "0-65535",
				description: "Ports to scan",
			},
			{
				displayName: "Rate Limit",
				name: "rateLimit",
				type: "number",
				default: 10000,
			},
			{
				displayName: "Banner Grabbing",
				name: "bannerGrabbing",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Connection Timeout",
				name: "connectionTimeout",
				type: "number",
				default: 10,
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
			response: [proxyRunner(new MasscanRunner(this, itemIndex))],
		};
	}
}
