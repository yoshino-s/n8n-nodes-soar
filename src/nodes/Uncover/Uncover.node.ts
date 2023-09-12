import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, injectCommonProperties } from "../../utils/executor";

export class Uncover implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Uncover",
		name: "uncover",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'uncover' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Uncover",
		defaults: {
			name: "Uncover",
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
						displayName: "Input",
						name: "input",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-engine",
								options: [
									{
										name: "Engine",
										value: "-engine",
										description:
											"Search engine to query (shodan,shodan-idb,fofa,censys,quake,hunter,zoomeye,netlas,publicwww,criminalip,hunterhow) (default shodan) (string[])",
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
						displayName: "Search Engine",
						name: "searchEngine",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-censys",
								options: [
									{
										name: "Censys",
										value: "-censys",
										description:
											"Search query for censys (example: -censys 'query.txt') (string[])",
									},
									{
										name: "CriminalIP",
										value: "-criminalip",
										description:
											"Search query for criminalip (example: -criminalip 'query.txt') (string[])",
									},
									{
										name: "Fofa",
										value: "-fofa",
										description:
											"Search query for fofa (example: -fofa 'query.txt') (string[])",
									},
									{
										name: "Hunter",
										value: "-hunter",
										description:
											"Search query for hunter (example: -hunter 'query.txt') (string[])",
									},
									{
										name: "Hunterhow",
										value: "-hunterhow",
										description:
											"Search query for hunterhow (example: -hunterhow 'query.txt') (string[])",
									},
									{
										name: "Netlas",
										value: "-netlas",
										description:
											"Search query for netlas (example: -netlas 'query.txt') (string[])",
									},
									{
										name: "Publicwww",
										value: "-publicwww",
										description:
											"Search query for publicwww (example: -publicwww 'query.txt') (string[])",
									},
									{
										name: "Quake",
										value: "-quake",
										description:
											"Search query for quake (example: -quake 'query.txt') (string[])",
									},
									{
										name: "Shodan",
										value: "-shodan",
										description:
											"Search query for shodan (example: -shodan 'query.txt') (string[])",
									},
									{
										name: "Shodan IDb",
										value: "-shodan-idb",
										description:
											"Search query for shodan-idb (example: -shodan-idb 'query.txt') (string[])",
									},
									{
										name: "Zoomeye",
										value: "-zoomeye",
										description:
											"Search query for zoomeye (example: -zoomeye 'query.txt') (string[])",
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
								default: "-config",
								options: [
									{
										name: "Config",
										value: "-config",
										description:
											'Flag configuration file (default "/root/.config/uncover/config.yaml") (string)',
									},
									{
										name: "ProvIDer",
										value: "-provider",
										description:
											'Provider configuration file (default "/root/.config/uncover/provider-config.yaml") (string)',
									},
									{
										name: "Rate Limit",
										value: "-rate-limit",
										description:
											"Maximum number of http requests to send per second (int)",
									},
									{
										name: "Rate Limit Minute",
										value: "-rate-limit-minute",
										description:
											"Maximum number of requests to send per minute (int)",
									},
									{
										name: "Retry",
										value: "-retry",
										description:
											"Number of times to retry a failed request (default 2) (int)",
									},
									{
										name: "Timeout",
										value: "-timeout",
										description:
											"Timeout in seconds (default 30) (int)",
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
								default: "-field",
								options: [
									{
										name: "Field",
										value: "-field",
										description:
											'Field to display in output (ip,port,host) (default "ip:port") (string)',
									},
									{
										name: "Raw",
										value: "-raw",
										description:
											"Write raw output as received by the remote api",
									},
									{
										name: "Limit",
										value: "-limit",
										description:
											"Limit the number of results to return (default 100) (int)",
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
			const response = await executor.run(idx, "uncover", "-query", {
				extraArgs: ["-disable-update-check", "-json", "-silent"],
				extraArgParameters: [
					"options.input",
					"options.searchEngine",
					"options.config",
					"options.output",
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
