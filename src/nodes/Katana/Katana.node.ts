import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, injectCommonProperties } from "../../utils/executor";

export class Katana implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Katana",
		name: "katana",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'katana' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Katana",
		defaults: {
			name: "Katana",
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
						displayName: "Configuration",
						name: "configuration",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-automatic-form-fill",
								options: [
									{
										name: "Automatic Form Fill",
										value: "-automatic-form-fill",
										description:
											"Enable automatic form filling (experimental)",
									},
									{
										name: "Config",
										value: "-config",
										description:
											"Path to the katana configuration file (string)",
									},
									{
										name: "Crawl Duration",
										value: "-crawl-duration",
										description:
											"Maximum duration to crawl the target for (s, m, h, d) (default s) (value)",
									},
									{
										name: "Depth",
										value: "-depth",
										description:
											"Maximum depth to crawl (default 3) (int)",
									},
									{
										name: "Field Config",
										value: "-field-config",
										description:
											"Path to custom field configuration file (string)",
									},
									{
										name: "Form Config",
										value: "-form-config",
										description:
											"Path to custom form configuration file (string)",
									},
									{
										name: "Form Extraction",
										value: "-form-extraction",
										description:
											"Extract form, input, textarea & select elements in jsonl output",
									},
									{
										name: "Headers",
										value: "-headers",
										description:
											"Custom header/cookie to include in all http request in header:value format (file) (string[])",
									},
									{
										name: "Ignore Query Params",
										value: "-ignore-query-params",
										description:
											"Ignore crawling same path with different query-param values",
									},
									{
										name: "Js Crawl",
										value: "-js-crawl",
										description:
											"Enable endpoint parsing / crawling in javascript file",
									},
									{
										name: "Jsluice",
										value: "-jsluice",
										description:
											"Enable jsluice parsing in javascript file (memory intensive)",
									},
									{
										name: "Known Files",
										value: "-known-files",
										description:
											"Enable crawling of known files (all,robotstxt,sitemapxml) (string)",
									},
									{
										name: "Max Response Size",
										value: "-max-response-size",
										description:
											"Maximum response size to read (default 9223372036854775807) (int)",
									},
									{
										name: "Proxy",
										value: "-proxy",
										description:
											"Http/socks5 proxy to use (string)",
									},
									{
										name: "Resolvers",
										value: "-resolvers",
										description:
											"List of custom resolver (file or comma-separated) (string[])",
									},
									{
										name: "Retry",
										value: "-retry",
										description:
											"Number of times to retry the request (default 1) (int)",
									},
									{
										name: "Strategy",
										value: "-strategy",
										description:
											'Visit strategy (depth-first, breadth-first) (default "depth-first") (string)',
									},
									{
										name: "Timeout",
										value: "-timeout",
										description:
											"Time to wait for request in seconds (default 10) (int)",
									},
									{
										name: "Tls Impersonate",
										value: "-tls-impersonate",
										description:
											"Enable experimental client hello (ja3) tls randomization",
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
						displayName: "Headless",
						name: "headless",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-chrome-data-dir",
								options: [
									{
										name: "Chrome Data Dir",
										value: "-chrome-data-dir",
										description:
											"Path to store chrome browser data (string)",
									},
									{
										name: "Chrome Ws URL",
										value: "-chrome-ws-url",
										description:
											"Use chrome browser instance launched elsewhere with the debugger listening at this URL (string)",
									},
									{
										name: "Headless",
										value: "-headless",
										description:
											"Enable headless hybrid crawling (experimental)",
									},
									{
										name: "Headless Options",
										value: "-headless-options",
										description:
											"Start headless chrome with additional options (string[])",
									},
									{
										name: "No Incognito",
										value: "-no-incognito",
										description:
											"Start headless chrome without incognito mode",
									},
									{
										name: "No Sandbox",
										value: "-no-sandbox",
										description:
											"Start headless chrome in --no-sandbox mode",
									},
									{
										name: "Show Browser",
										value: "-show-browser",
										description:
											"Show the browser on the screen with headless mode",
									},
									{
										name: "System Chrome",
										value: "-system-chrome",
										description:
											"Use local installed chrome browser instead of katana installed",
									},
									{
										name: "System Chrome Path",
										value: "-system-chrome-path",
										description:
											"Use specified chrome browser for headless crawling (string)",
									},
									{
										name: "Xhr Extraction",
										value: "-xhr-extraction",
										description:
											"Extract xhr request URL,method in jsonl output",
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
						displayName: "Scope",
						name: "scope",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-crawl-out-scope",
								options: [
									{
										name: "Crawl Out Scope",
										value: "-crawl-out-scope",
										description:
											"Out of scope URL regex to be excluded by crawler (string[])",
									},
									{
										name: "Crawl Scope",
										value: "-crawl-scope",
										description:
											"In scope URL regex to be followed by crawler (string[])",
									},
									{
										name: "Display Out Scope",
										value: "-display-out-scope",
										description:
											"Display external endpoint from scoped crawling",
									},
									{
										name: "Field Scope",
										value: "-field-scope",
										description:
											'Pre-defined scope field (dn,rdn,fqdn) (default "rdn") (string)',
									},
									{
										name: "No Scope",
										value: "-no-scope",
										description:
											"Disables host based default scope",
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
								default: "-extension-filter",
								options: [
									{
										name: "Extension Filter",
										value: "-extension-filter",
										description:
											"Filter output for given extension (eg, -ef png,css) (string[])",
									},
									{
										name: "Extension Match",
										value: "-extension-match",
										description:
											"Match output for given extension (eg, -em php,html,js) (string[])",
									},
									{
										name: "Field",
										value: "-field",
										description:
											"Field to display in output (URL,path,fqdn,rdn,rurl,qurl,qpath,file,ufile,key,value,kv,dir,udir) (string)",
									},
									{
										name: "Filter Condition",
										value: "-filter-condition",
										description:
											"Filter response with dsl based condition (string)",
									},
									{
										name: "Filter Regex",
										value: "-filter-regex",
										description:
											"Regex or list of regex to filter on output URL (cli, file) (string[])",
									},
									{
										name: "Match Condition",
										value: "-match-condition",
										description:
											"Match response with dsl based condition (string)",
									},
									{
										name: "Match Regex",
										value: "-match-regex",
										description:
											"Regex or list of regex to match on output URL (cli, file) (string[])",
									},
									{
										name: "Store Field",
										value: "-store-field",
										description:
											"Field to store in per-host output (URL,path,fqdn,rdn,rurl,qurl,qpath,file,ufile,key,value,kv,dir,udir) (string)",
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
								default: "-concurrency",
								options: [
									{
										name: "Concurrency",
										value: "-concurrency",
										description:
											"Number of concurrent fetchers to use (default 10) (int)",
									},
									{
										name: "Delay",
										value: "-delay",
										description:
											"Request delay between each request in seconds (int)",
									},
									{
										name: "Parallelism",
										value: "-parallelism",
										description:
											"Number of concurrent inputs to process (default 10) (int)",
									},
									{
										name: "Rate Limit",
										value: "-rate-limit",
										description:
											"Maximum requests to send per second (default 150) (int)",
									},
									{
										name: "Rate Limit Minute",
										value: "-rate-limit-minute",
										description:
											"Maximum number of requests to send per minute (int)",
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
								default: "-omit-raw",
								options: [
									{
										name: "Omit Raw",
										value: "-omit-raw",
										description:
											"Omit raw requests/responses from jsonl output",
									},
									{
										name: "Omit Body",
										value: "-omit-body",
										description:
											"Omit response body from jsonl output",
									},
								],
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
			const response = await executor.run(idx, "katana", "-list", {
				extraArgs: ["-disable-update-check", "-jsonl", "-silent"],
				extraArgParameters: [
					"options.configuration",
					"options.headless",
					"options.scope",
					"options.filter",
					"options.rateLimit",
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