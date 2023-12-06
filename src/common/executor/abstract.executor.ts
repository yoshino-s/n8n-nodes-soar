import { IExecuteFunctions, NodeOperationError } from "n8n-workflow";

export interface ExecutorRunOptions {
	env?: string[];
	ignoreStdout?: boolean;
	ignoreStderr?: boolean;
}

export interface ExecutorRunResult {
	stdout: string;
	stderr: string;
}

export abstract class AbstractExecutor {
	constructor(readonly func: IExecuteFunctions) {}

	abstract run(
		cmd: string[],
		options?: ExecutorRunOptions,
	): Promise<ExecutorRunResult>;

	async readFile(path: string): Promise<string> {
		const { stdout, stderr } = await this.run(["cat", path]);

		if (stderr !== "") {
			throw new NodeOperationError(
				this.func.getNode(),
				new Error(stderr),
			);
		}

		return stdout;
	}

	async writeFile(path: string, content: string): Promise<void> {
		// using base64 to avoid escaping issues
		const { stderr } = await this.run([
			"bash",
			"-c",
			`echo ${Buffer.from(content).toString(
				"base64",
			)} | base64 -d > ${path}`,
		]);

		if (stderr !== "") {
			throw new NodeOperationError(
				this.func.getNode(),
				new Error(stderr),
			);
		}
	}
}
