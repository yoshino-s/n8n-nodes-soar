import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset, Ports } from "@/common/asset";
import { NodeConnectionType } from "@/common/connectionType";
import { ContainerRunner, RunOptions } from "@/common/runner/container.runner";
import { PORT_RUNNER_PRIORITY } from "@/common/runner/priority";

class MasscanRunner extends ContainerRunner {
	public cmd(assets: Asset[]): string[] {
		return [
			"masscan",
			"-oJ",
			`/tmp/${this.func.getNode().id}.json`,
			"--max-rate",
			(
				this.func.getNodeParameter(
					"rateLimit",
					this.itemIndex
				) as number
			).toString(),
			"--connection-timeout",
			(
				this.func.getNodeParameter(
					"connectionTimeout",
					this.itemIndex
				) as number
			).toString(),
			"--ports",
			this.func.getNodeParameter("ports", this.itemIndex) as string,
			...((this.func.getNodeParameter(
				"bannerGrabbing",
				this.itemIndex
			) as boolean)
				? ["--banners"]
				: []),
			...new Set(assets.map((n) => n.getHost()).filter(Boolean)),
		];
	}

	public process(
		rawAssets: Asset[],
		stdout: string,
		files: Record<string, string>
	): Asset[] {
		const raw = JSON.parse(
			Buffer.from(
				files[`/tmp/${this.func.getNode().id}.json`],
				"base64"
			).toString() + "]"
		) as Array<{
			ip: string;
			ports: Array<{
				port: number;
				protocol: "tcp" | "udp";
			}>;
		}>;
		const ports = new Map<string, Ports>();
		raw.forEach((n) => {
			const ports_ = ports.get(n.ip) ?? [];
			ports_.push(...n.ports);
			ports.set(n.ip, ports_);
		});
		return rawAssets.flatMap((a) => {
			const result = ports.get(a.getHost());
			if (result) {
				a.success = true;
				a.ports = result;
			}
			return a.splitByPorts();
		});
	}

	public options(assets: Asset[]): RunOptions {
		const options = super.options(assets);
		options.ignoreStdout = true;
		options.collectFiles.push(`/tmp/${this.func.getNode().id}.json`);
		return options;
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
		],
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number
	): Promise<SupplyData> {
		return {
			response: [
				new MasscanRunner(
					"masscan",
					PORT_RUNNER_PRIORITY,
					this,
					itemIndex
				),
			],
		};
	}
}
