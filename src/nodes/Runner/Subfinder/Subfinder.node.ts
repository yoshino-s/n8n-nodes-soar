import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset } from "@/common/asset";
import { NodeConnectionType } from "@/common/connectionType";
import { ContainerRunner } from "@/common/runner/container.runner";
import { DOMAIN_RUNNER_PRIORITY } from "@/common/runner/priority";

class SubfinderRunner extends ContainerRunner {
	public cmd(assets: Asset[]): string[] {
		return [
			"subfinder",
			"-disable-update-check",
			"-json",
			"-silent",
			"-domain",
			assets.map((a) => a.getDomain()).join(","),
			...this.collectGeneratedOptions([
				"options.source",
				"options.filter",
				"options.rateLimit",
				"options.output",
				"options.configuration",
				"options.optimization",
			]),
		];
	}

	public process(rawAssets: Asset[], stdout: string): Asset[] {
		const subdomains = new Map<string, string[]>();
		for (const line of stdout.trim().split("\n")) {
			const json = JSON.parse(line);
			subdomains.set(json.input, [
				...(subdomains.get(json.input) ?? []),
				json.host,
			]);
		}
		return rawAssets.flatMap((a) => {
			a.subdomains = subdomains.get(a.getDomain());
			a.success = true;
			return a.splitBySubdomains();
		});
	}
}

export class Subfinder implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Subfinder",
		name: "subfinder",
		icon: "file:subfinder.svg",
		group: ["transform"],
		version: 1,
		codex: {
			alias: ["Subfinder"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
			resources: {
				primaryDocumentation: [
					{ url: "https://github.com/projectdiscovery/subfinder" },
				],
			},
		},
		description: "Interact with Subfinder",
		defaults: {
			name: "Subfinder",
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
				displayName: "Options",
				name: "options",
				type: "fixedCollection",
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: "Source",
						name: "source",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-sources",
								options: [
									{
										name: "Sources",
										value: "-sources",
										description:
											"Specific sources to use for discovery (-s crtsh,github). Use -ls to display all available sources. (string[])",
									},
									{
										name: "Recursive",
										value: "-recursive",
										description:
											"Use only sources that can handle subdomains recursively (e.g. subdomain.domain.tld vs domain.tld)",
									},
									{
										name: "All",
										value: "-all",
										description:
											"Use all sources for enumeration (slow)",
									},
									{
										name: "Exclude Sources",
										value: "-exclude-sources",
										description:
											"Sources to exclude from enumeration (-es alienvault,zoomeye) (string[])",
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
								default: "-match",
								options: [
									{
										name: "Match",
										value: "-match",
										description:
											"Subdomain or list of subdomain to match (file or comma-separated) (string[])",
									},
									{
										name: "Filter",
										value: "-filter",
										description:
											"Subdomain or list of subdomain to filter (file or comma-separated) (string[])",
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
						displayName: "Rate Limit",
						name: "rateLimit",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-rate-limit",
								options: [
									{
										name: "Rate Limit",
										value: "-rate-limit",
										description:
											"Maximum number of http requests to send per second (global) (int)",
									},
									{
										name: "Rate Limits",
										value: "-rate-limits",
										description:
											'Maximum number of http requests to send per second four providers in key=value format (-rls hackertarget=10/m) (default ["github=30/m", "fullhunt=60/m", "robtex=18446744073709551615/ms", "securitytrails=1/s", "shodan=1/s", "virustotal=4/m", "hackertarget=2/s", "waybackarchive=15/m", "whoisxmlapi=50/s"]) (value)',
									},
									{
										name: "T",
										value: "-t",
										description:
											"Number of concurrent goroutines for resolving (-active only) (default 10) (int)",
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
						displayName: "Output",
						name: "output",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-collect-sources",
								options: [
									{
										name: "Collect Sources",
										value: "-collect-sources",
										description:
											"Include all sources in the output (-JSON only)",
									},
									{
										name: "IP",
										value: "-ip",
										description:
											"Include host IP in output (-active only)",
									},
								],
							},
						],
					},
					{
						displayName: "Configuration",
						name: "configuration",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-active",
								options: [
									{
										name: "Active",
										value: "-active",
										description:
											"Display active subdomains only",
									},
									{
										name: "Config",
										value: "-config",
										description:
											'Flag config file (default "/root/.config/subfinder/config.yaml") (string)',
									},
									{
										name: "Exclude IP",
										value: "-exclude-ip",
										description:
											"Exclude IPs from the list of domains",
									},
									{
										name: "ProvIDer Config",
										value: "-provider-config",
										description:
											'Provider config file (default "/root/.config/subfinder/provider-config.yaml") (string)',
									},
									{
										name: "Proxy",
										value: "-proxy",
										description:
											"Http proxy to use with subfinder (string)",
									},
									{
										name: "R",
										value: "-r",
										description:
											"Comma-separated list of resolvers to use (string[])",
									},
									{
										name: "Rlist",
										value: "-rlist",
										description:
											"File containing list of resolvers to use (string)",
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
						displayName: "Optimization",
						name: "optimization",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-timeout",
								options: [
									{
										name: "Timeout",
										value: "-timeout",
										description:
											"Seconds to wait before timing out (default 30) (int)",
									},
									{
										name: "Max Time",
										value: "-max-time",
										description:
											"Minutes to wait for enumeration results (default 10) (int)",
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
			response: new SubfinderRunner(
				"subfinder",
				DOMAIN_RUNNER_PRIORITY,
				this,
				itemIndex
			),
		};
	}
}
