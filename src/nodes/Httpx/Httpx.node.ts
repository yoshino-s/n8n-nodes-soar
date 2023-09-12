import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor, injectCommonProperties } from "../../utils/executor";

export class Httpx implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Soar: Httpx",
		name: "httpx",
		group: ["output"],
		version: 1,
		subtitle:
			"={{ 'httpx' + ($parameter['batch'] ? ' (Batch)' : ' on ' + $parameter['target']) }}",
		description: "Interact with Httpx",
		defaults: {
			name: "Httpx",
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
						displayName: "Probes",
						name: "probes",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-asn",
								options: [
									{
										name: "Asn",
										value: "-asn",
										description:
											"Display host asn information",
									},
									{
										name: "CDN",
										value: "-cdn",
										description: "Display cdn in use",
									},
									{
										name: "Cname",
										value: "-cname",
										description: "Display host cname",
									},
									{
										name: "Content Length",
										value: "-content-length",
										description:
											"Display response content-length",
									},
									{
										name: "Content Type",
										value: "-content-type",
										description:
											"Display response content-type",
									},
									{
										name: "Favicon",
										value: "-favicon",
										description:
											"Display mmh3 hash for '/favicon.ico' file",
									},
									{
										name: "Hash",
										value: "-hash",
										description:
											"Display response body hash (supported: md5,mmh3,simhash,sha1,sha256,sha512) (string)",
									},
									{
										name: "IP",
										value: "-ip",
										description: "Display host ip",
									},
									{
										name: "Jarm",
										value: "-jarm",
										description:
											"Display jarm fingerprint hash",
									},
									{
										name: "Line Count",
										value: "-line-count",
										description:
											"Display response body line count",
									},
									{
										name: "Location",
										value: "-location",
										description:
											"Display response redirect location",
									},
									{
										name: "Method",
										value: "-method",
										description:
											"Display http request method",
									},
									{
										name: "Probe",
										value: "-probe",
										description: "Display probe status",
									},
									{
										name: "Response Time",
										value: "-response-time",
										description: "Display response time",
									},
									{
										name: "Status Code",
										value: "-status-code",
										description:
											"Display response status-code",
									},
									{
										name: "Tech Detect",
										value: "-tech-detect",
										description:
											"Display technology in use based on wappalyzer dataset",
									},
									{
										name: "Title",
										value: "-title",
										description: "Display page title",
									},
									{
										name: "Web Server",
										value: "-web-server",
										description: "Display server name",
									},
									{
										name: "Websocket",
										value: "-websocket",
										description:
											"Display server using websocket",
									},
									{
										name: "Word Count",
										value: "-word-count",
										description:
											"Display response body word count",
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
								default: "-screenshot",
								options: [
									{
										name: "Screenshot",
										value: "-screenshot",
										description:
											"Enable saving screenshot of the page using headless browser",
									},
									{
										name: "System Chrome",
										value: "-system-chrome",
										description:
											"Enable using local installed chrome for screenshot",
									},
								],
							},
						],
					},
					{
						displayName: "Matchers",
						name: "matchers",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-match-cdn",
								options: [
									{
										name: "Match CDN",
										value: "-match-cdn",
										description:
											"Match host with specified cdn provider (stackpath, cloudfront, fastly, google, leaseweb) (string[])",
									},
									{
										name: "Match Code",
										value: "-match-code",
										description:
											"Match response with specified status code (-mc 200,302) (string)",
									},
									{
										name: "Match Condition",
										value: "-match-condition",
										description:
											"Match response with dsl expression condition (string)",
									},
									{
										name: "Match Favicon",
										value: "-match-favicon",
										description:
											"Match response with specified favicon hash (-mfc 1494302000) (string[])",
									},
									{
										name: "Match Length",
										value: "-match-length",
										description:
											"Match response with specified content length (-ml 100,102) (string)",
									},
									{
										name: "Match Line Count",
										value: "-match-line-count",
										description:
											"Match response body with specified line count (-mlc 423,532) (string)",
									},
									{
										name: "Match Regex",
										value: "-match-regex",
										description:
											"Match response with specified regex (-mr admin) (string)",
									},
									{
										name: "Match Response Time",
										value: "-match-response-time",
										description:
											"Match response with specified response time in seconds (-mrt '< 1') (string)",
									},
									{
										name: "Match String",
										value: "-match-string",
										description:
											"Match response with specified string (-ms admin) (string)",
									},
									{
										name: "Match Word Count",
										value: "-match-word-count",
										description:
											"Match response body with specified word count (-mwc 43,55) (string)",
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
						displayName: "Extractor",
						name: "extractor",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-extract-regex",
								options: [
									{
										name: "Extract Regex",
										value: "-extract-regex",
										description:
											"Display response content with matched regex (string[])",
									},
									{
										name: "Extract Preset",
										value: "-extract-preset",
										description:
											"Display response content matched by a pre-defined regex (ipv4,mail,URL) (string[])",
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
						displayName: "Filters",
						name: "filters",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-filter-cdn",
								options: [
									{
										name: "Filter CDN",
										value: "-filter-cdn",
										description:
											"Filter host with specified cdn provider (stackpath, cloudfront, fastly, google, leaseweb) (string[])",
									},
									{
										name: "Filter Code",
										value: "-filter-code",
										description:
											"Filter response with specified status code (-fc 403,401) (string)",
									},
									{
										name: "Filter Condition",
										value: "-filter-condition",
										description:
											"Filter response with dsl expression condition (string)",
									},
									{
										name: "Filter Error Page",
										value: "-filter-error-page",
										description:
											"Filter response with ML based error page detection",
									},
									{
										name: "Filter Favicon",
										value: "-filter-favicon",
										description:
											"Filter response with specified favicon hash (-mfc 1494302000) (string[])",
									},
									{
										name: "Filter Length",
										value: "-filter-length",
										description:
											"Filter response with specified content length (-fl 23,33) (string)",
									},
									{
										name: "Filter Line Count",
										value: "-filter-line-count",
										description:
											"Filter response body with specified line count (-flc 423,532) (string)",
									},
									{
										name: "Filter Regex",
										value: "-filter-regex",
										description:
											"Filter response with specified regex (-fe admin) (string)",
									},
									{
										name: "Filter Response Time",
										value: "-filter-response-time",
										description:
											"Filter response with specified response time in seconds (-frt '> 1') (string)",
									},
									{
										name: "Filter String",
										value: "-filter-string",
										description:
											"Filter response with specified string (-fs admin) (string)",
									},
									{
										name: "Filter Word Count",
										value: "-filter-word-count",
										description:
											"Filter response body with specified word count (-fwc 423,532) (string)",
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
								default: "-threads",
								options: [
									{
										name: "Threads",
										value: "-threads",
										description:
											"Number of threads to use (default 50) (int)",
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
						displayName: "Miscellaneous",
						name: "miscellaneous",
						values: [
							{
								displayName: "Options",
								name: "key",
								type: "options",
								default: "-csp-probe",
								options: [
									{
										name: "Csp Probe",
										value: "-csp-probe",
										description:
											"Send http probes on the extracted CSP domains",
									},
									{
										name: "Http2",
										value: "-http2",
										description:
											"Probe and display server supporting HTTP2",
									},
									{
										name: "List Dsl Variables",
										value: "-list-dsl-variables",
										description:
											"List JSON output field keys name that support dsl matcher/filter",
									},
									{
										name: "Path",
										value: "-path",
										description:
											"Path or list of paths to probe (comma-separated, file) (string)",
									},
									{
										name: "PIPeline",
										value: "-pipeline",
										description:
											"Probe and display server supporting HTTP1.1 pipeline",
									},
									{
										name: "Ports",
										value: "-ports",
										description:
											"Ports to probe (nmap syntax: eg http:1,2-10,11,https:80) (string[])",
									},
									{
										name: "Probe All IPs",
										value: "-probe-all-ips",
										description:
											"Probe all the ips associated with same host",
									},
									{
										name: "Tls Grab",
										value: "-tls-grab",
										description:
											"Perform TLS(SSL) data grabbing",
									},
									{
										name: "Tls Probe",
										value: "-tls-probe",
										description:
											"Send http probes on the extracted TLS domains (dns_name)",
									},
									{
										name: "Vhost",
										value: "-vhost",
										description:
											"Probe and display server supporting VHOST",
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
								default: "-include-response",
								options: [
									{
										name: "Include Response",
										value: "-include-response",
										description:
											"Include http request/response in JSON output (-JSON only)",
									},
									{
										name: "Include Response Base64",
										value: "-include-response-base64",
										description:
											"Include base64 encoded http request/response in JSON output (-JSON only)",
									},
									{
										name: "Include Chain",
										value: "-include-chain",
										description:
											"Include redirect http chain in JSON output (-JSON only)",
									},
								],
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
								default: "-allow",
								options: [
									{
										name: "Allow",
										value: "-allow",
										description:
											"Allowed list of IP/CIDR's to process (file or comma-separated) (string[])",
									},
									{
										name: "Body",
										value: "-body",
										description:
											"Post body to include in http request (string)",
									},
									{
										name: "Config",
										value: "-config",
										description:
											"Path to the httpx configuration file (default $HOME/.config/httpx/config.yaml) (string)",
									},
									{
										name: "Deny",
										value: "-deny",
										description:
											"Denied list of IP/CIDR's to process (file or comma-separated) (string[])",
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
										description: "Follow http redirects",
									},
									{
										name: "Header",
										value: "-header",
										description:
											"Custom http headers to send with request (string[])",
									},
									{
										name: "Http Proxy",
										value: "-http-proxy",
										description:
											"Http proxy to use (eg http://127.0.0.1:8080) (string)",
									},
									{
										name: "Leave Default Ports",
										value: "-leave-default-ports",
										description:
											"Leave default http/https ports in host header (eg. http://host:80 - https://host:443.",
									},
									{
										name: "Max Redirects",
										value: "-max-redirects",
										description:
											"Max number of redirects to follow per host (default 10) (int)",
									},
									{
										name: "No Decode",
										value: "-no-decode",
										description: "Avoid decoding body",
									},
									{
										name: "No Stdin",
										value: "-no-stdin",
										description: "Disable Stdin processing",
									},
									{
										name: "Random Agent",
										value: "-random-agent",
										description:
											"Enable Random User-Agent to use (default true)",
									},
									{
										name: "Resolvers",
										value: "-resolvers",
										description:
											"List of custom resolver (file or comma-separated) (string[])",
									},
									{
										name: "Resume",
										value: "-resume",
										description:
											"Resume scan using resume.cfg",
									},
									{
										name: "SkIP Dedupe",
										value: "-skip-dedupe",
										description:
											"Disable dedupe input items (only used with stream mode)",
									},
									{
										name: "Sni Name",
										value: "-sni-name",
										description:
											"Custom TLS SNI name (string)",
									},
									{
										name: "Stream",
										value: "-stream",
										description:
											"Stream mode - start elaborating input targets without sorting",
									},
									{
										name: "Tls Impersonate",
										value: "-tls-impersonate",
										description:
											"Enable experimental client hello (ja3) tls randomization",
									},
									{
										name: "Unsafe",
										value: "-unsafe",
										description:
											"Send raw requests skipping golang normalization",
									},
									{
										name: "Vhost Input",
										value: "-vhost-input",
										description:
											"Get a list of vhosts as input",
									},
									{
										name: "X",
										value: "-x",
										description:
											"Request methods to probe, use 'all' to probe all HTTP methods (string)",
									},
									{
										name: "Ztls",
										value: "-ztls",
										description:
											"Use ztls library with autofallback to standard one for tls13",
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
								default: "-delay",
								options: [
									{
										name: "Delay",
										value: "-delay",
										description:
											"Duration between each http request (eg: 200ms, 1s) (default -1ns) (value)",
									},
									{
										name: "Exclude CDN",
										value: "-exclude-cdn",
										description:
											"Skip full port scans for CDNs (only checks for 80,443)",
									},
									{
										name: "Max Host Error",
										value: "-max-host-error",
										description:
											"Max error count per host before skipping remaining path/s (default 30) (int)",
									},
									{
										name: "No Fallback",
										value: "-no-fallback",
										description:
											"Display both probed protocol (HTTPS and HTTP)",
									},
									{
										name: "No Fallback Scheme",
										value: "-no-fallback-scheme",
										description:
											"Probe with protocol scheme specified in input",
									},
									{
										name: "Response Size To Read",
										value: "-response-size-to-read",
										description:
											"Max response size to read in bytes (default 2147483647) (int)",
									},
									{
										name: "Response Size To Save",
										value: "-response-size-to-save",
										description:
											"Max response size to save in bytes (default 2147483647) (int)",
									},
									{
										name: "Retries",
										value: "-retries",
										description: "Number of retries (int)",
									},
									{
										name: "Timeout",
										value: "-timeout",
										description:
											"Timeout in seconds (default 10) (int)",
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
			const response = await executor.run(idx, "httpx", "-target", {
				extraArgs: ["-disable-update-check", "-json", "-silent"],
				extraArgParameters: [
					"options.probes",
					"options.headless",
					"options.matchers",
					"options.extractor",
					"options.filters",
					"options.rateLimit",
					"options.miscellaneous",
					"options.output",
					"options.configurations",
					"options.optimizations",
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
