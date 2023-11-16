import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { DEFAULT_RESOLVERS, DnsOptions, DnsQueryType } from "./script";

import { Asset, DnsRecord } from "@/common/asset";
import { NodeConnectionType } from "@/common/connectionType";
import {
	ContainerRunner,
	IMAGE,
	RunOptions,
} from "@/common/runner/container.runner";
import { DNS_RUNNER_PRIORITY } from "@/common/runner/priority";

class DnsRunner extends ContainerRunner {
	public cmd(): string[] {
		return ["node", "/tmp/entry.js"];
	}

	public options(assets: Asset[]): RunOptions {
		const options = super.options(assets);
		const dnsOptions: DnsOptions = {
			queryTypes: this.func.getNodeParameter(
				"queryType",
				0,
				[],
			) as DnsQueryType[],
			resolvers: (
				this.func.getNodeParameter("resolvers.resolvers", 0) as {
					resolver: string;
				}[]
			).map((n) => n.resolver),
			timeout: this.func.getNodeParameter("timeout", 0) as number,
		};

		options.image = IMAGE.SCRIPT;

		options.files["/tmp/dns.js"] = Buffer.from(
			readFileSync(join(__dirname, "script.js")),
		).toString("base64");

		options.files["/tmp/entry.js"] = Buffer.from(
			`const {resolve} = require("/tmp/dns.js");(async()=> {const hosts=${JSON.stringify(
				assets.map((n) => n.getDomain()).filter(Boolean),
			)};console.log(JSON.stringify(await Promise.all(hosts.map(async (host) => resolve(host, ${JSON.stringify(
				dnsOptions,
			)})))));process.exit(0);})();`,
		).toString("base64");

		return options;
	}

	public process(rawAssets: Asset[], stdout: string): Asset[] {
		return (JSON.parse(stdout) as DnsRecord[]).flatMap((n, idx) => {
			rawAssets[idx].dnsRecord = n;
			rawAssets[idx].success = true;
			return rawAssets[idx].splitBySubdomains();
		});
	}
}

export class Dns implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Dns",
		name: "dns",
		icon: "fa:map-signs",
		group: ["transform"],
		codex: {
			alias: ["Dns"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
		},
		version: 1,
		description: "Interact with Dns",
		defaults: {
			name: "Dns",
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
				displayName: "Query Type",
				name: "queryType",
				type: "multiOptions",
				default: ["A", "AAAA", "TXT", "CNAME", "NS", "MX"],
				options: [
					{
						name: "A",
						value: "A",
					},
					{
						name: "AAAA",
						value: "AAAA",
					},
					{
						name: "TXT",
						value: "TXT",
					},
					{
						name: "CNAME",
						value: "CNAME",
					},
					{
						name: "NS",
						value: "NS",
					},
					{
						name: "MX",
						value: "MX",
					},
					{
						name: "PTR",
						value: "PTR",
					},
					{
						name: "SOA",
						value: "SOA",
					},
					{
						name: "SRV",
						value: "SRV",
					},
					{
						name: "NAPTR",
						value: "NAPTR",
					},
					{
						name: "ANY",
						value: "ANY",
					},
				] satisfies { name: DnsQueryType; value: DnsQueryType }[],
			},
			{
				displayName: "Timeout",
				name: "timeout",
				type: "number",
				default: 1000,
			},
			{
				displayName: "Resolvers",
				name: "resolvers",
				type: "fixedCollection",
				default: {
					resolvers: DEFAULT_RESOLVERS.map((n) => ({
						resolver: n,
					})),
				},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: "resolvers",
						displayName: "Resolvers",
						values: [
							{
								displayName: "Resolver",
								name: "resolver",
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
		itemIndex: number,
	): Promise<SupplyData> {
		return {
			response: [
				new DnsRunner("dns", DNS_RUNNER_PRIORITY, this, itemIndex),
			],
		};
	}
}
