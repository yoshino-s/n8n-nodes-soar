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
	DNS_RUNNER_PRIORITY,
	Priority,
} from "@/common/runner/decorator";

@Priority(DNS_RUNNER_PRIORITY)
@AssetRunner
class DnsRunner extends ContainerRunner<Asset> {
	async run(
		collector: Collector,
		inputs: IRunnerData<Asset>[],
	): Promise<IRunnerData<Asset>[]> {
		const assets = inputs.map((n) => n.json);
		const options = super.getOptions();
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

		options.files["/tmp/dns.js"] = readFileSync(
			join(__dirname, "script.js"),
		).toString();

		options.files["/tmp/entry.js"] =
			`const {resolve} = require("/tmp/dns.js");(async()=> {const hosts=${JSON.stringify(
				assets.map((n) => n.getDomain()).filter(Boolean),
			)};console.log(JSON.stringify(await Promise.all(hosts.map(async (host) => resolve(host, ${JSON.stringify(
				dnsOptions,
			)})))));process.exit(0);})();`;

		const { stdout } = await this.runCmd(
			collector,
			["node", "/tmp/entry.js"],
			options,
		);

		const records = JSON.parse(stdout) as DnsRecord[];

		return records.flatMap((n, idx) => {
			if (Object.keys(n).length) {
				return this.constructData(
					inputs[idx].sourceInputIndex,
					inputs[idx].json.splitByDnsRecords(n),
					true,
				);
			}
			return inputs[idx];
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
			response: [proxyRunner(new DnsRunner(this, itemIndex))],
		};
	}
}
