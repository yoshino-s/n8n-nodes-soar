import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

import { SoarExecutor } from "../../utils/executor";

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
		properties: [
			{
				displayName: "Batch",
				name: "batch",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Target",
				name: "target",
				type: "string",
				default: "",
				displayOptions: {
					show: {
						batch: [false],
					},
				},
			},
			{
				displayName: "Targets",
				name: "targets",
				type: "json",
				default: "[]",
				displayOptions: {
					show: {
						batch: [true],
					},
				},
			},
			{
				displayName: "Advanced",
				name: "advanced",
				type: "boolean",
				default: false,
				description: "Whether show advanced options",
			},
			{
				displayName: "Environment Variables",
				name: "env",
				type: "fixedCollection",
				displayOptions: {
					show: {
						advanced: [true],
					},
				},
				placeholder: "Add Environment variable",
				typeOptions: {
					multipleValues: true,
				},
				default: {
					envs: [],
				},
				options: [
					{
						name: "envs",
						displayName: "Envs",
						values: [
							{
								displayName: "Key",
								name: "key",
								type: "string",
								default: "",
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
			{
				displayName: "Write Files",
				name: "files",
				type: "fixedCollection",
				displayOptions: {
					show: {
						advanced: [true],
					},
				},
				placeholder: "Add File to write",
				typeOptions: {
					multipleValues: true,
				},
				default: {
					files: [],
				},
				options: [
					{
						name: "files",
						displayName: "Files",
						values: [
							{
								displayName: "Name",
								name: "name",
								type: "string",
								default: "",
							},
							{
								displayName: "Content",
								name: "content",
								type: "string",
								default: "",
							},
						],
					},
				],
			},
			{
				displayName: "Collect Files",
				name: "collectFiles",
				type: "fixedCollection",
				displayOptions: {
					show: {
						advanced: [true],
					},
				},
				placeholder: "Add File to collect",
				typeOptions: {
					multipleValues: true,
				},
				default: {
					files: [],
				},
				options: [
					{
						name: "files",
						displayName: "Files",
						values: [
							{
								displayName: "Name",
								name: "name",
								type: "string",
								default: "",
							},
						],
					},
				],
			},
		],
	};
	async execute(
		this: IExecuteFunctions
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const result: INodeExecutionData[] = [];
		const executor = new SoarExecutor(this);
		for (let idx = 0; idx < this.getInputData().length; idx++) {
			const env: Record<string, string> = {};
			const files: Record<string, string> = {};
			let collectFiles: string[] = [];
			const advanced = this.getNodeParameter("advanced", idx) as boolean;
			if (advanced) {
				const _env =
					(this.getNodeParameter("env.envs", idx) as {
						key: string;
						value: string;
					}[]) ?? [];
				Object.assign(
					env,
					Object.fromEntries(
						_env.map(({ key, value }) => [key, value])
					)
				);
				const _files =
					(this.getNodeParameter("files.files", idx) as {
						name: string;
						content: string;
					}[]) ?? [];
				Object.assign(
					files,
					Object.fromEntries(
						_files.map(({ name, content }) => [name, content])
					)
				);
				const _collectFiles =
					(this.getNodeParameter("collectFiles.files", idx) as {
						name: string;
					}[]) ?? [];
				collectFiles = collectFiles.concat(
					_collectFiles.map(({ name }) => name)
				);
			}

			let targets: string[] = [];
			if (this.getNodeParameter("batch", idx) as boolean) {
				targets =
					(JSON.parse(
						this.getNodeParameter("targets", idx) as string
					) as string[]) ?? [];
			} else {
				targets = [
					(this.getNodeParameter("target", idx) as string) ?? "",
				];
			}

			const response = await executor.run(
				idx,
				[
					"katana",
					"-silent",
					"-duc",
					...targets.flatMap((target) => ["-u", target]),
				],
				env,
				files,
				collectFiles
			);

			result.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(
						response.stdout
							.trim()
							.split("\n")
							.map((n) => ({
								url: n,
							}))
					),
					{ itemData: { item: idx } }
				)
			);
		}

		return [result];
	}
}
