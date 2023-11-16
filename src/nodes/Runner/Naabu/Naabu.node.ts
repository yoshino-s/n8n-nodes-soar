import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset, Ports } from "@/common/asset";
import { NodeConnectionType } from "@/common/connectionType";
import { ContainerRunner } from "@/common/runner/container.runner";
import { PORT_RUNNER_PRIORITY } from "@/common/runner/priority";

class NaabuRunner extends ContainerRunner {
	public cmd(assets: Asset[]): string[] {
		return [
			"naabu",
			"-disable-update-check",
			"-json",
			"-silent",
			"-ip-version",
			"4,6",
			"-host",
			[...new Set(assets.map((n) => n.getHost()).filter(Boolean))].join(
				","
			),
			...this.collectGeneratedOptions([
				"options.input",
				"options.port",
				"options.rateLimit",
				"options.configuration",
				"options.hostDiscovery",
				"options.servicesDiscovery",
				"options.optimization",
			]),
		];
	}

	public process(rawAssets: Asset[], stdout: string): Asset[] {
		const ports = new Map<string, Ports>();
		for (const line of stdout.trim().split("\n")) {
			const json = JSON.parse(line);
			ports.set(json.ip, [
				...(ports.get(json.ip) ?? []),
				{
					port: json.port,
					protocol: json.protocol,
				},
			]);
		}
		return rawAssets.flatMap((a) => {
			const result = ports.get(a.getHost());
			if (result) {
				a.ports = result;
				a.success = true;
			}
			return a.splitByPorts();
		});
	}
}

export class Naabu implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Naabu",
		name: "naabu",
		icon: "file:naabu.svg",
		group: ["output"],
		version: 1,
		codex: {
			alias: ["Naabu"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
			resources: {
				primaryDocumentation: [
					{
						url: "https://github.com/projectdiscovery/naabu",
					},
				],
			},
		},
		description: "Interact with Naabu",
		defaults: {
			name: "Naabu",
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
						displayName: "Input",
						name: "input",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-exclude-hosts",
								options: [
									{
										name: "Exclude Hosts",
										value: "-exclude-hosts",
										description:
											"Hosts to exclude from the scan (comma-separated) (string)",
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
						displayName: "Port",
						name: "port",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-display-cdn",
								options: [
									{
										name: "Display CDN",
										value: "-display-cdn",
										description: "Display cdn in use",
									},
									{
										name: "Exclude CDN",
										value: "-exclude-cdn",
										description:
											"Skip full port scans for CDN/WAF (only scan for port 80,443)",
									},
									{
										name: "Exclude Ports",
										value: "-exclude-ports",
										description:
											"Ports to exclude from scan (comma-separated) (string)",
									},
									{
										name: "Port",
										value: "-port",
										description:
											"Ports to scan (80,443, 100-200) (string)",
									},
									{
										name: "Port Threshold",
										value: "-port-threshold",
										description:
											"Port threshold to skip port scan for the host (int)",
									},
									{
										name: "Ports File",
										value: "-ports-file",
										description:
											"List of ports to scan (file) (string)",
									},
									{
										name: "Top Ports",
										value: "-top-ports",
										description:
											"Top ports to scan (default 100) [full,100,1000] (string)",
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
								default: "-c",
								options: [
									{
										name: "C",
										value: "-c",
										description:
											"General internal worker threads (default 25) (int)",
									},
									{
										name: "Rate",
										value: "-rate",
										description:
											"Packets to send per second (default 1000) (int)",
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
						displayName: "Configuration",
						name: "configuration",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-input-read-timeout",
								options: [
									{
										name: "Input Read Timeout",
										value: "-input-read-timeout",
										description:
											"Timeout on input read (default 3m0s) (value)",
									},
									{
										name: "Interface",
										value: "-interface",
										description:
											"Network Interface to use for port scan (string)",
									},
									{
										name: "Interface List",
										value: "-interface-list",
										description:
											"List available interfaces and public ip",
									},
									{
										name: "Nmap",
										value: "-nmap",
										description:
											"Invoke nmap scan on targets (nmap must be installed) - Deprecated",
									},
									{
										name: "Nmap Cli",
										value: "-nmap-cli",
										description:
											"Nmap command to run on found results (example: -nmap-cli 'nmap -sV') (string)",
									},
									{
										name: "No Stdin",
										value: "-no-stdin",
										description: "Disable Stdin processing",
									},
									{
										name: "Passive",
										value: "-passive",
										description:
											"Display passive open ports using shodan internetdb api",
									},
									{
										name: "Proxy",
										value: "-proxy",
										description:
											"Socks5 proxy (ip[:port] / fqdn[:port] (string)",
									},
									{
										name: "Proxy Auth",
										value: "-proxy-auth",
										description:
											"Socks5 proxy authentication (username:password) (string)",
									},
									{
										name: "R",
										value: "-r",
										description:
											"List of custom resolver dns resolution (comma-separated or from file) (string)",
									},
									{
										name: "Resume",
										value: "-resume",
										description:
											"Resume scan using resume.cfg",
									},
									{
										name: "Scan All IPs",
										value: "-scan-all-ips",
										description:
											"Scan all the IP's associated with DNS record",
									},
									{
										name: "Scan Type",
										value: "-scan-type",
										description:
											'Type of port scan (SYN/CONNECT) (default "s") (string)',
									},
									{
										name: "Source IP",
										value: "-source-ip",
										description:
											"Source ip and port (x.x.x.x:yyy) (string)",
									},
									{
										name: "Stream",
										value: "-stream",
										description:
											"Stream mode (disables resume, nmap, verify, retries, shuffling, etc)",
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
						displayName: "Host Discovery",
						name: "hostDiscovery",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-arp-ping",
								options: [
									{
										name: "Arp Ping",
										value: "-arp-ping",
										description:
											"ARP ping (host discovery needs to be enabled)",
									},
									{
										name: "Host Discovery",
										value: "-host-discovery",
										description:
											"Perform Only Host Discovery",
									},
									{
										name: "Nd Ping",
										value: "-nd-ping",
										description:
											"IPv6 Neighbor Discovery (host discovery needs to be enabled)",
									},
									{
										name: "Probe Icmp Address Mask",
										value: "-probe-icmp-address-mask",
										description:
											"ICMP address mask request Ping (host discovery needs to be enabled)",
									},
									{
										name: "Probe Icmp Echo",
										value: "-probe-icmp-echo",
										description:
											"ICMP echo request Ping (host discovery needs to be enabled)",
									},
									{
										name: "Probe Icmp Timestamp",
										value: "-probe-icmp-timestamp",
										description:
											"ICMP timestamp request Ping (host discovery needs to be enabled)",
									},
									{
										name: "Probe Tcp Ack",
										value: "-probe-tcp-ack",
										description:
											"TCP ACK Ping (host discovery needs to be enabled) (string[])",
									},
									{
										name: "Probe Tcp Syn",
										value: "-probe-tcp-syn",
										description:
											"TCP SYN Ping (host discovery needs to be enabled) (string[])",
									},
									{
										name: "Rev Ptr",
										value: "-rev-ptr",
										description:
											"Reverse PTR lookup for input ips",
									},
									{
										name: "SkIP Host Discovery",
										value: "-skip-host-discovery",
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
						displayName: "Services Discovery",
						name: "servicesDiscovery",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-service-discovery",
								options: [
									{
										name: "Service Discovery",
										value: "-service-discovery",
									},
									{
										name: "Service Version",
										value: "-service-version",
									},
								],
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
								default: "-ping",
								options: [
									{
										name: "Ping",
										value: "-ping",
										description:
											"Ping probes for verification of host",
									},
									{
										name: "Retries",
										value: "-retries",
										description:
											"Number of retries for the port scan (default 3) (int)",
									},
									{
										name: "Timeout",
										value: "-timeout",
										description:
											"Millisecond to wait before timing out (default 1000) (int)",
									},
									{
										name: "Verify",
										value: "-verify",
										description:
											"Validate the ports again with TCP verification",
									},
									{
										name: "Warm Up Time",
										value: "-warm-up-time",
										description:
											"Time in seconds between scan phases (default 2) (int)",
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
				new NaabuRunner("naabu", PORT_RUNNER_PRIORITY, this, itemIndex),
			],
		};
	}
}
