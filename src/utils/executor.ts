import { IExecuteFunctions, NodeOperationError } from "n8n-workflow";

import { DockerRuneer } from "./runner/docker.runner";
import { K8sRunner } from "./runner/k8s.runner";
import { Runner } from "./runner/runner";

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
	async run<T extends string>(
		idx: number,
		cmdd: string[],
		env: Record<string, string>,
		files?: Record<T, string>,
		collectFiles: T[] = []
	): Promise<{
		stdout: string;
		files: Record<T, string>;
	}> {
		const runner = await this.getRunner(idx);
		const cmdline = ["/usr/local/bin/runner"];
		for (const [key, value] of Object.entries<string>(files)) {
			cmdline.push("--files", `${key}:${btoa(value)}`);
		}
		for (const key of collectFiles) {
			cmdline.push("--collect-files", key);
		}
		cmdline.push("--");
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
