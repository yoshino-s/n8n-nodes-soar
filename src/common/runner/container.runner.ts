import { INodeProperties, NodeOperationError } from "n8n-workflow";

import { Asset } from "../asset";
import { Collector } from "../collector";

import { Runner } from "./runner";

export const IMAGE = {
	DEFAULT: "registry.yoshino-s.xyz/yoshino-s/soar-image:dev",
	SCRIPT: "registry.yoshino-s.xyz/yoshino-s/soar-image/script:dev",
} as const;

export interface RunOptions {
	envs: Record<string, string>;
	files: Record<string, string>;
	collectFiles: string[];
	ignoreStdout?: boolean;
	ignoreStderr?: boolean;
	image?: string;
}

export const injectCommonProperties = (
	p: INodeProperties[],
): INodeProperties[] => {
	return [
		...p,
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
};

export abstract class ContainerRunner extends Runner {
	public abstract cmd(assets: Asset[]): string[];
	public abstract process(
		rawAssets: Asset[],
		stdout: string,
		files: Record<string, string>,
	): Asset[];

	protected collectGeneratedOptions(extraArgParameters: string[]): string[] {
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

	public options(assets: Asset[]): RunOptions {
		assets;
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

	async __run(collector: Collector, assets: Asset[]): Promise<Asset[]> {
		if (collector.executor === undefined) {
			throw new NodeOperationError(
				this.func.getNode(),
				"Executor is not set",
			);
		}

		const options = this.options(assets);
		const cmd = this.cmd(assets);

		let cmdline = ["/usr/local/bin/runner"];

		if (options.files) {
			for (const [key, value] of Object.entries(options.files)) {
				cmdline.push("--files", `${key}:${value}`);
			}
		}
		if (options.collectFiles) {
			for (const key of options.collectFiles) {
				cmdline.push("--collect-files", key);
			}
		}

		if (options.ignoreStdout) {
			cmdline.push("--ignore-stdout");
		}

		if (options.ignoreStderr) {
			cmdline.push("--ignore-stderr");
		}

		cmdline.push("--");

		cmdline = cmdline.concat(cmd);

		const {
			stdout,
			stderr,
			error,
			files: resultFiles,
		} = await collector.executor.run(
			cmdline,
			options.image ?? IMAGE.DEFAULT,
			options.envs,
		);

		if (error) {
			throw new NodeOperationError(this.func.getNode(), new Error(error));
		}

		if (stderr) {
			this.func.logger.warn(stderr);
		}

		return this.process(assets, stdout, resultFiles ?? {});
	}
}
