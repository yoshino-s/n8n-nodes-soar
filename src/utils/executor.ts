import {
	IExecuteFunctions,
	INodeProperties,
	NodeOperationError,
} from "n8n-workflow";

import { DockerRuneer } from "./runner/docker.runner";
import { K8sRunner } from "./runner/k8s.runner";
import { Runner } from "./runner/runner";

export const commonProperties: INodeProperties[] = [
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
		displayName: "Advanced Config",
		name: "advanced",
		type: "fixedCollection",
		default: {},
		typeOptions: {
			multipleValues: true,
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
			{
				name: "Files",
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
			{
				name: "Collect Files",
				displayName: "colllectFiles",
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
];

export class SoarExecutor {
	constructor(private readonly func: IExecuteFunctions) {}

	async getRunner(idx: number): Promise<Runner> {
		try {
			const dockerCredentials = await this.func.getCredentials(
				"dockerCredentialsApi",
				idx
			);
			return new DockerRuneer(dockerCredentials, this.func);
		} catch (e) {
			//
		}
		try {
			const k8sCredentials = await this.func.getCredentials(
				"kubernetesCredentialsApi",
				idx
			);
			return new K8sRunner(k8sCredentials, this.func);
		} catch (e) {
			//
		}
		throw new NodeOperationError(
			this.func.getNode(),
			"No credentials got returned!"
		);
	}
	async run(
		idx: number,
		target: string,
		targetArg: string,
		extraArgs: string[],
		env: Record<string, string> = {},
		files: Record<string, string> = {},
		collectFiles: string[] = []
	): Promise<{
		stdout: string;
		files: Record<string, string>;
	}> {
		const runner = await this.getRunner(idx);
		const cmdline = ["/usr/local/bin/runner"];

		const _env =
			(this.func.getNodeParameter("advanced.envs", idx, []) as {
				key: string;
				value: string;
			}[]) ?? [];
		env = Object.assign(
			{},
			env,
			Object.fromEntries(_env.map(({ key, value }) => [key, value]))
		);
		const _files =
			(this.func.getNodeParameter("advanced.files", idx, []) as {
				name: string;
				content: string;
			}[]) ?? [];
		files = Object.assign(
			{},
			files,
			Object.fromEntries(
				_files.map(({ name, content }) => [name, content])
			)
		);
		const _collectFiles =
			(this.func.getNodeParameter("advanced.collectFiles", idx, []) as {
				name: string;
			}[]) ?? [];
		collectFiles = collectFiles.concat(
			_collectFiles.map(({ name }) => name)
		);

		let targets: string[] = [];
		if (this.func.getNodeParameter("batch", idx) as boolean) {
			targets =
				(JSON.parse(
					this.func.getNodeParameter("targets", idx) as string
				) as string[]) ?? [];
		} else {
			targets = [
				(this.func.getNodeParameter("target", idx) as string) ?? "",
			];
		}

		for (const [key, value] of Object.entries<string>(files)) {
			cmdline.push("--files", `${key}:${btoa(value)}`);
		}
		for (const key of collectFiles) {
			cmdline.push("--collect-files", key);
		}
		cmdline.push("--");

		const cmdd = [
			target,
			...targets.flatMap((target) => [targetArg, target]),
			...extraArgs,
		];

		for (const cmd of cmdd) {
			cmdline.push(cmd);
		}

		const {
			stdout,
			stderr,
			err,
			files: resultFiles,
		} = await runner.run(cmdline, env);
		if (err) {
			throw new NodeOperationError(this.func.getNode(), stderr);
		}
		if (stderr) {
			this.func.logger.warn(stderr);
		}
		return { stdout, files: resultFiles };
	}
}
