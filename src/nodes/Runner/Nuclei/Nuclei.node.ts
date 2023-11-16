import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Asset } from "@/common/asset";
import { NodeConnectionType } from "@/common/connectionType";
import { ContainerRunner } from "@/common/runner/container.runner";
import { EXPLOIT_RUNNER_PRIORITY } from "@/common/runner/priority";

class NucleiRunner extends ContainerRunner {
	public cmd(assets: Asset[]): string[] {
		return [
			"nuclei",
			"-silent",
			"-jsonl",
			"-disable-update-check",
			"-target",
			assets.map((a) => a.getHostAndPort()).join(","),
			...this.collectGeneratedOptions([
				"options.target",
				"options.templates",
				"options.filtering",
				"options.output",
				"options.configurations",
				"options.interactsh",
				"options.fuzzing",
				"options.uncover",
				"options.rateLimit",
				"options.optimizations",
				"options.headless",
				"options.statistics",
				"options.cloud",
			]),
		];
	}

	public process(rawAssets: Asset[], stdout: string): Asset[] {
		const result = new Map<string, any[]>();
		for (const line of stdout.trim().split("\n")) {
			const json = JSON.parse(line);
			result.set(json.host, (result.get(json.host) || []).concat(json));
		}
		return rawAssets.map((a) => {
			const res = result.get(a.getHostAndPort());
			if (res) {
				a.response = res;
				a.success = true;
			}
			return a;
		});
	}
}

export class Nuclei implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Nuclei",
		name: "nuclei",
		icon: "file:nuclei.svg",
		group: ["transform"],
		version: 1,
		codex: {
			alias: ["Nuclei"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
			resources: {
				primaryDocumentation: [
					{
						url: "https://github.com/projectdiscovery/nuclei",
					},
				],
			},
		},
		description: "Interact with Nuclei",
		defaults: {
			name: "Nuclei",
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
						displayName: "Target",
						name: "target",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-scan-all-ips",
								options: [
									{
										name: "Scan All IPs",
										value: "-scan-all-ips",
										description:
											"Scan all the IP's associated with dns record",
									},
									{
										name: "IP Version",
										value: "-ip-version",
										description:
											"IP version to scan of hostname (4,6) - (default 4) (string[])",
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
						displayName: "Templates",
						name: "templates",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-automatic-scan",
								options: [
									{
										name: "Automatic Scan",
										value: "-automatic-scan",
										description:
											"Automatic web scan using wappalyzer technology detection to tags mapping",
									},
									{
										name: "New Templates",
										value: "-new-templates",
										description:
											"Run only new templates added in latest nuclei-templates release",
									},
									{
										name: "New Templates Version",
										value: "-new-templates-version",
										description:
											"Run new templates added in specific version (string[])",
									},
									{
										name: "No Strict Syntax",
										value: "-no-strict-syntax",
										description:
											"Disable strict syntax check on templates",
									},
									{
										name: "Template Display",
										value: "-template-display",
										description:
											"Displays the templates content",
									},
									{
										name: "Template URL",
										value: "-template-url",
										description:
											"Template URL or list containing template URLs to run (comma-separated, file) (string[])",
									},
									{
										name: "Templates",
										value: "-templates",
										description:
											"List of template or template directory to run (comma-separated, file) (string[])",
									},
									{
										name: "Tl",
										value: "-tl",
										description:
											"List all available templates",
									},
									{
										name: "ValIDate",
										value: "-validate",
										description:
											"Validate the passed templates to nuclei",
									},
									{
										name: "Workflow URL",
										value: "-workflow-url",
										description:
											"Workflow URL or list containing workflow URLs to run (comma-separated, file) (string[])",
									},
									{
										name: "Workflows",
										value: "-workflows",
										description:
											"List of workflow or workflow directory to run (comma-separated, file) (string[])",
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
						displayName: "Filtering",
						name: "filtering",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-author",
								options: [
									{
										name: "Author",
										value: "-author",
										description:
											"Templates to run based on authors (comma-separated, file) (string[])",
									},
									{
										name: "Exclude ID",
										value: "-exclude-id",
										description:
											"Templates to exclude based on template IDs (comma-separated, file) (string[])",
									},
									{
										name: "Exclude Matchers",
										value: "-exclude-matchers",
										description:
											"Template matchers to exclude in result (string[])",
									},
									{
										name: "Exclude Severity",
										value: "-exclude-severity",
										description:
											"Value[] templates to exclude based on severity. Possible values: info, low, medium, high, critical, unknown.",
									},
									{
										name: "Exclude Tags",
										value: "-exclude-tags",
										description:
											"Templates to exclude based on tags (comma-separated, file) (string[])",
									},
									{
										name: "Exclude Templates",
										value: "-exclude-templates",
										description:
											"Template or template directory to exclude (comma-separated, file) (string[])",
									},
									{
										name: "Exclude Type",
										value: "-exclude-type",
										description:
											"Value[] templates to exclude based on protocol type. Possible values: dns, file, http, headless, tcp, workflow, ssl, websocket, whois.",
									},
									{
										name: "Include Tags",
										value: "-include-tags",
										description:
											"Tags to be executed even if they are excluded either by default or configuration (string[])",
									},
									{
										name: "Include Templates",
										value: "-include-templates",
										description:
											"Templates to be executed even if they are excluded either by default or configuration (string[])",
									},
									{
										name: "Severity",
										value: "-severity",
										description:
											"Value[] templates to run based on severity. Possible values: info, low, medium, high, critical, unknown.",
									},
									{
										name: "Tags",
										value: "-tags",
										description:
											"Templates to run based on tags (comma-separated, file) (string[])",
									},
									{
										name: "Template Condition",
										value: "-template-condition",
										description:
											"Templates to run based on expression condition (string[])",
									},
									{
										name: "Template ID",
										value: "-template-id",
										description:
											"Templates to run based on template IDs (comma-separated, file, allow-wildcard) (string[])",
									},
									{
										name: "Type",
										value: "-type",
										description:
											"Value[] templates to run based on protocol type. Possible values: dns, file, http, headless, tcp, workflow, ssl, websocket, whois.",
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
								default: "-include-rr -omit-raw",
								options: [
									{
										name: "Include Rr Omit Raw",
										value: "-include-rr -omit-raw",
										description:
											"Include request/response pairs in the JSON, JSONL, and Markdown outputs (for findings only) [DEPRECATED use -omit-raw] (default true)",
									},
									{
										name: "Markdown Export",
										value: "-markdown-export",
										description:
											"Directory to export results in markdown format (string)",
									},
									{
										name: "Matcher Status",
										value: "-matcher-status",
										description:
											"Display match failure status",
									},
									{
										name: "No Meta",
										value: "-no-meta",
										description:
											"Disable printing result metadata in cli output",
									},
									{
										name: "Omit Raw",
										value: "-omit-raw",
										description:
											"Omit request/response pairs in the JSON, JSONL, and Markdown outputs (for findings only)",
									},
									{
										name: "Report Db",
										value: "-report-db",
										description:
											"Nuclei reporting database (always use this to persist report data) (string)",
									},
									{
										name: "Sarif Export",
										value: "-sarif-export",
										description:
											"File to export results in SARIF format (string)",
									},
									{
										name: "Timestamp",
										value: "-timestamp",
										description:
											"Enables printing timestamp in cli output",
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
						displayName: "Configurations",
						name: "configurations",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-allow-local-file-access",
								options: [
									{
										name: "Allow Local File Access",
										value: "-allow-local-file-access",
										description:
											"Allows file (payload) access anywhere on the system",
									},
									{
										name: "Attack Type",
										value: "-attack-type",
										description:
											"Type of payload combinations to perform (batteringram,pitchfork,clusterbomb) (string)",
									},
									{
										name: "Client Ca",
										value: "-client-ca",
										description:
											"Client certificate authority file (PEM-encoded) used for authenticating against scanned hosts (string)",
									},
									{
										name: "Client Cert",
										value: "-client-cert",
										description:
											"Client certificate file (PEM-encoded) used for authenticating against scanned hosts (string)",
									},
									{
										name: "Client Key",
										value: "-client-key",
										description:
											"Client key file (PEM-encoded) used for authenticating against scanned hosts (string)",
									},
									{
										name: "Config",
										value: "-config",
										description:
											"Path to the nuclei configuration file (string)",
									},
									{
										name: "Config Directory",
										value: "-config-directory",
										description:
											"Override the default config path ($home/.config) (string)",
									},
									{
										name: "Disable Clustering",
										value: "-disable-clustering",
										description:
											"Disable clustering of requests",
									},
									{
										name: "Disable Redirects",
										value: "-disable-redirects",
										description:
											"Disable redirects for http templates",
									},
									{
										name: "Env Vars",
										value: "-env-vars",
										description:
											"Enable environment variables to be used in template",
									},
									{
										name: "Follow Host Redirects",
										value: "-follow-host-redirects",
										description:
											"Follow redirects on the same host",
									},
									{
										name: "Follow Redirects",
										value: "-follow-redirects",
										description:
											"Enable following redirects for http templates",
									},
									{
										name: "Force Http2",
										value: "-force-http2",
										description:
											"Force http2 connection on requests",
									},
									{
										name: "Header",
										value: "-header",
										description:
											"Custom header/cookie to include in all http request in header:value format (cli, file) (string[])",
									},
									{
										name: "Interface",
										value: "-interface",
										description:
											"Network interface to use for network scan (string)",
									},
									{
										name: "Max Redirects",
										value: "-max-redirects",
										description:
											"Max number of redirects to follow for http templates (default 10) (int)",
									},
									{
										name: "Passive",
										value: "-passive",
										description:
											"Enable passive HTTP response processing mode",
									},
									{
										name: "Report Config",
										value: "-report-config",
										description:
											"Nuclei reporting module configuration file (string)",
									},
									{
										name: "Reset",
										value: "-reset",
										description:
											"Reset removes all nuclei configuration and data files (including nuclei-templates)",
									},
									{
										name: "Resolvers",
										value: "-resolvers",
										description:
											"File containing resolver list for nuclei (string)",
									},
									{
										name: "Response Size Read",
										value: "-response-size-read",
										description:
											"Max response size to read in bytes (default 10485760) (int)",
									},
									{
										name: "Response Size Save",
										value: "-response-size-save",
										description:
											"Max response size to read in bytes (default 1048576) (int)",
									},
									{
										name: "Restrict Local Network Access",
										value: "-restrict-local-network-access",
										description:
											"Blocks connections to the local / private network",
									},
									{
										name: "Show Match Line",
										value: "-show-match-line",
										description:
											"Show match lines for file templates, works with extractors only",
									},
									{
										name: "Sni",
										value: "-sni",
										description:
											"Tls sni hostname to use (default: input domain name) (string)",
									},
									{
										name: "Source IP",
										value: "-source-ip",
										description:
											"Source ip address to use for network scan (string)",
									},
									{
										name: "System Resolvers",
										value: "-system-resolvers",
										description:
											"Use system DNS resolving as error fallback",
									},
									{
										name: "Tls Impersonate",
										value: "-tls-impersonate",
										description:
											"Enable experimental client hello (ja3) tls randomization",
									},
									{
										name: "Var",
										value: "-var",
										description:
											"Custom vars in key=value format (value)",
									},
									{
										name: "Ztls",
										value: "-ztls",
										description:
											"Use ztls library with autofallback to standard one for tls13 [Deprecated] autofallback to ztls is enabled by default",
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
						displayName: "Interactsh",
						name: "interactsh",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-interactions-cache-size",
								options: [
									{
										name: "Interactions Cache Size",
										value: "-interactions-cache-size",
										description:
											"Number of requests to keep in the interactions cache (default 5000) (int)",
									},
									{
										name: "Interactions Cooldown Period",
										value: "-interactions-cooldown-period",
										description:
											"Extra time for interaction polling before exiting (default 5) (int)",
									},
									{
										name: "Interactions Eviction",
										value: "-interactions-eviction",
										description:
											"Number of seconds to wait before evicting requests from cache (default 60) (int)",
									},
									{
										name: "Interactions Poll Duration",
										value: "-interactions-poll-duration",
										description:
											"Number of seconds to wait before each interaction poll request (default 5) (int)",
									},
									{
										name: "Interactsh Server",
										value: "-interactsh-server",
										description:
											"Interactsh server URL for self-hosted instance (default: oast.pro,oast.live,oast.site,oast.online,oast.fun,oast.me) (string)",
									},
									{
										name: "Interactsh Token",
										value: "-interactsh-token",
										description:
											"Authentication token for self-hosted interactsh server (string)",
									},
									{
										name: "No Interactsh",
										value: "-no-interactsh",
										description:
											"Disable interactsh server for OAST testing, exclude OAST based templates",
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
						displayName: "Fuzzing",
						name: "fuzzing",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-fuzzing-type",
								options: [
									{
										name: "Fuzzing Type",
										value: "-fuzzing-type",
										description:
											"Overrides fuzzing type set in template (replace, prefix, postfix, infix) (string)",
									},
									{
										name: "Fuzzing Mode",
										value: "-fuzzing-mode",
										description:
											"Overrides fuzzing mode set in template (multiple, single) (string)",
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
						displayName: "Uncover",
						name: "uncover",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-uncover",
								options: [
									{
										name: "Uncover",
										value: "-uncover",
										description: "Enable uncover engine",
									},
									{
										name: "Uncover Engine",
										value: "-uncover-engine",
										description:
											"Uncover search engine (shodan,censys,fofa,shodan-idb,quake,hunter,zoomeye,netlas,criminalip,publicwww,hunterhow) (default shodan) (string[])",
									},
									{
										name: "Uncover Field",
										value: "-uncover-field",
										description:
											'Uncover fields to return (ip,port,host) (default "ip:port") (string)',
									},
									{
										name: "Uncover Limit",
										value: "-uncover-limit",
										description:
											"Uncover results to return (default 100) (int)",
									},
									{
										name: "Uncover Query",
										value: "-uncover-query",
										description:
											"Uncover search query (string[])",
									},
									{
										name: "Uncover Ratelimit",
										value: "-uncover-ratelimit",
										description:
											"Override ratelimit of engines with unknown ratelimit (default 60 req/min) (default 60) (int)",
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
								default: "-bulk-size",
								options: [
									{
										name: "Bulk Size",
										value: "-bulk-size",
										description:
											"Maximum number of hosts to be analyzed in parallel per template (default 25) (int)",
									},
									{
										name: "Concurrency",
										value: "-concurrency",
										description:
											"Maximum number of templates to be executed in parallel (default 25) (int)",
									},
									{
										name: "Headless Bulk Size",
										value: "-headless-bulk-size",
										description:
											"Maximum number of headless hosts to be analyzed in parallel per template (default 10) (int)",
									},
									{
										name: "Headless Concurrency",
										value: "-headless-concurrency",
										description:
											"Maximum number of headless templates to be executed in parallel (default 10) (int)",
									},
									{
										name: "Rate Limit",
										value: "-rate-limit",
										description:
											"Maximum number of requests to send per second (default 150) (int)",
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
						displayName: "Optimizations",
						name: "optimizations",
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
										name: "Leave Default Ports",
										value: "-leave-default-ports",
										description:
											"Leave default HTTP/HTTPS ports (eg. host:80,host:443).",
									},
									{
										name: "Max Host Error",
										value: "-max-host-error",
										description:
											"Max errors for a host before skipping from scan (default 30) (int)",
									},
									{
										name: "No Httpx",
										value: "-no-httpx",
										description:
											"Disable httpx probing for non-URL input",
									},
									{
										name: "No Mhe",
										value: "-no-mhe",
										description:
											"Disable skipping host from scan based on errors",
									},
									{
										name: "No Stdin",
										value: "-no-stdin",
										description: "Disable stdin processing",
									},
									{
										name: "Project",
										value: "-project",
										description:
											"Use a project folder to avoid sending same request multiple times",
									},
									{
										name: "Project Path",
										value: "-project-path",
										description:
											'Set a specific project path (default "/tmp") (string)',
									},
									{
										name: "Retries",
										value: "-retries",
										description:
											"Number of times to retry a failed request (default 1) (int)",
									},
									{
										name: "Scan Strategy",
										value: "-scan-strategy",
										description:
											"Strategy to use while scanning(auto/host-spray/template-spray) (default auto) (value)",
									},
									{
										name: "Stop At First Match",
										value: "-stop-at-first-match",
										description:
											"Stop processing HTTP requests after the first match (may break template/workflow logic)",
									},
									{
										name: "Stream",
										value: "-stream",
										description:
											"Stream mode - start elaborating without sorting the input",
									},
									{
										name: "Timeout",
										value: "-timeout",
										description:
											"Time to wait in seconds before timeout (default 10) (int)",
									},
									{
										name: "Track Error",
										value: "-track-error",
										description:
											"Adds given error to max-host-error watchlist (standard, file) (string[])",
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
								default: "-headless",
								options: [
									{
										name: "Headless",
										value: "-headless",
										description:
											"Enable templates that require headless browser support (root user on Linux will disable sandbox)",
									},
									{
										name: "Headless Options",
										value: "-headless-options",
										description:
											"Start headless chrome with additional options (string[])",
									},
									{
										name: "List Headless Action",
										value: "-list-headless-action",
										description:
											"List available headless actions",
									},
									{
										name: "Page Timeout",
										value: "-page-timeout",
										description:
											"Seconds to wait for each page in headless mode (default 20) (int)",
									},
									{
										name: "Show Browser",
										value: "-show-browser",
										description:
											"Show the browser on the screen when running templates with headless mode",
									},
									{
										name: "System Chrome",
										value: "-system-chrome",
										description:
											"Use local installed Chrome browser instead of nuclei installed",
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
						displayName: "Statistics",
						name: "statistics",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-metrics",
								options: [
									{
										name: "Metrics",
										value: "-metrics",
										description:
											"Expose nuclei metrics on a port",
									},
									{
										name: "Metrics Port",
										value: "-metrics-port",
										description:
											"Port to expose nuclei metrics on (default 9092) (int)",
									},
									{
										name: "Stats",
										value: "-stats",
										description:
											"Display statistics about the running scan",
									},
									{
										name: "Stats Interval",
										value: "-stats-interval",
										description:
											"Number of seconds to wait between showing a statistics update (default 5) (int)",
									},
									{
										name: "Stats JSON",
										value: "-stats-json",
										description:
											"Display statistics in JSONL(ines) format",
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
						displayName: "Cloud",
						name: "cloud",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-add-datasource",
								options: [
									{
										name: "Add Datasource",
										value: "-add-datasource",
										description:
											"Add specified data source (s3,github) (string)",
									},
									{
										name: "Add Target",
										value: "-add-target",
										description:
											"Add target(s) to cloud (string)",
									},
									{
										name: "Add Template",
										value: "-add-template",
										description:
											"Add template(s) to cloud (string)",
									},
									{
										name: "Cloud",
										value: "-cloud",
										description: "Run scan on nuclei cloud",
									},
									{
										name: "Delete Datasource",
										value: "-delete-datasource",
										description:
											"Delete specified data source (string)",
									},
									{
										name: "Delete Scan",
										value: "-delete-scan",
										description:
											"Delete cloud scan by ID (string)",
									},
									{
										name: "Delete Target",
										value: "-delete-target",
										description:
											"Delete target(s) from cloud (string)",
									},
									{
										name: "Delete Template",
										value: "-delete-template",
										description:
											"Delete template(s) from cloud (string)",
									},
									{
										name: "Disable Reportsource",
										value: "-disable-reportsource",
										description:
											"Disable specified reporting source (string)",
									},
									{
										name: "Enable Reportsource",
										value: "-enable-reportsource",
										description:
											"Enable specified reporting source (string)",
									},
									{
										name: "Get Target",
										value: "-get-target",
										description:
											"Get target content by ID (string)",
									},
									{
										name: "Get Template",
										value: "-get-template",
										description:
											"Get template content by ID (string)",
									},
									{
										name: "Limit",
										value: "-limit",
										description:
											"Limit the number of output to display (default 100) (int)",
									},
									{
										name: "List Datasource",
										value: "-list-datasource",
										description:
											"List cloud datasource by ID",
									},
									{
										name: "List Output",
										value: "-list-output",
										description:
											"List scan output by scan ID (string)",
									},
									{
										name: "List Reportsource",
										value: "-list-reportsource",
										description: "List reporting sources",
									},
									{
										name: "List Scan",
										value: "-list-scan",
										description:
											"List previous cloud scans",
									},
									{
										name: "List Target",
										value: "-list-target",
										description: "List cloud target by ID",
									},
									{
										name: "List Template",
										value: "-list-template",
										description:
											"List cloud template by ID",
									},
									{
										name: "No Store",
										value: "-no-store",
										description:
											"Disable scan/output storage on cloud",
									},
									{
										name: "No Tables",
										value: "-no-tables",
										description:
											"Do not display pretty-printed tables",
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
		itemIndex: number,
	): Promise<SupplyData> {
		return {
			response: [
				new NucleiRunner(
					"nuclei",
					EXPLOIT_RUNNER_PRIORITY,
					this,
					itemIndex,
				),
			],
		};
	}
}
