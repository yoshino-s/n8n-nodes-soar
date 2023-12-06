import { INodeProperties, NodeOperationError } from "n8n-workflow";

import { Collector } from "../collector";

import { AbstractRunner } from "./runner";

export interface RunOptions {
	envs: Record<string, string>;
	files: Record<string, string>;
	collectFiles: string[];
	ignoreStdout?: boolean;
	ignoreStderr?: boolean;
	image?: string;
}

export interface RunResult {
	stdout: string;
	stderr: string;
	files: Record<string, string>;
}

export const advancedOptions: INodeProperties[] = [
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
				displayName: "Collect Files",
				name: "collectFiles",
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

export abstract class ContainerRunner<T> extends AbstractRunner<T> {
	protected collectGeneratedCmdOptions(
		extraArgParameters: string[],
	): string[] {
		const cmdline: string[] = [];
		for (const parameter of extraArgParameters) {
			const value = this.func.getNodeParameter(
				parameter,
				this.itemIndex,
				null,
			);
			if (!value) continue;
			if (typeof value === "string") {
				cmdline.push(parameter, value);
			} else if (Array.isArray(value)) {
				value.forEach((v) => {
					if (typeof v === "string") {
						cmdline.push(v);
					} else {
						const { key, value } = v;
						if (value) {
							cmdline.push(key, value);
						} else {
							cmdline.push(key);
						}
					}
				});
			}
		}
		return cmdline;
	}

	public getOptions(): RunOptions {
		const options: RunOptions = {
			envs: {},
			files: {},
			collectFiles: [],
		};
		const _env = this.func.getNodeParameter(
			"advanced.envs",
			this.itemIndex,
			[],
		) as {
			key: string;
			value: string;
		}[];

		options.envs = Object.fromEntries(
			_env.map(({ key, value }) => [key, value]),
		);

		const _files = this.func.getNodeParameter(
			"advanced.files",
			this.itemIndex,
			[],
		) as {
			name: string;
			content: string;
		}[];
		options.files = Object.fromEntries(
			_files.map(({ name, content }) => [name, content]),
		);

		const _collectFiles = this.func.getNodeParameter(
			"advanced.collectFiles",
			this.itemIndex,
			[],
		) as {
			name: string;
		}[];
		options.collectFiles = _collectFiles.map(({ name }) => name);
		return options;
	}

	protected async runCmd(
		collector: Collector,
		cmd: string[],
		options: RunOptions,
	): Promise<RunResult> {
		const executor = collector.executor;
		if (executor === undefined) {
			throw new NodeOperationError(
				this.func.getNode(),
				new Error("Executor is not set"),
			);
		}
		await Promise.all(
			Object.entries(options.files).map(([k, v]) => {
				return executor.writeFile(k, v);
			}),
		);

		const { stdout, stderr } = await executor.run(cmd, {
			env: Object.entries(options.envs).map(([k, v]) => `${k}=${v}`),
			ignoreStderr: options.ignoreStderr,
			ignoreStdout: options.ignoreStdout,
		});

		if (stderr) {
			throw new NodeOperationError(
				this.func.getNode(),
				new Error(`stderr: ${stderr}`),
			);
		}

		const resultFiles: Record<string, string> = (
			await Promise.all(
				options.collectFiles.map(async (n) => {
					const content = await executor.readFile(n);
					return [n, content] as [string, string];
				}),
			)
		).reduce(
			(acc, [k, v]) => {
				acc[k] = v;
				return acc;
			},
			{} as Record<string, string>,
		);

		return {
			stdout,
			stderr,
			files: resultFiles,
		};
	}
}
