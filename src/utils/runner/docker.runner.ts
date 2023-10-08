import { Writable } from "node:stream";

import Dockerode from "dockerode";
import {
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	NodeOperationError,
} from "n8n-workflow";

import { IMAGE, Runner } from "./runner";

export class DockerRuneer implements Runner {
	docker: Dockerode;
	constructor(
		credentials: ICredentialDataDecryptedObject,
		private readonly func: IExecuteFunctions
	) {
		if (credentials === undefined) {
			throw new NodeOperationError(
				func.getNode(),
				"No credentials got returned!"
			);
		}
		this.docker = new Dockerode(credentials);
	}
	async run<T extends string>(
		cmd: string[],
		env?: Record<string, string>,
		image: string = IMAGE
	): Promise<{
		stdout?: string;
		stderr?: string;
		err?: string;
		files?: Record<T, string>;
	}> {
		let stdout = "";
		let stderr = "";

		const outStream = new Writable({
			write(chunk, encoding, done) {
				stdout += chunk.toString();
				done();
			},
		});

		const errStream = new Writable({
			write(chunk, encoding, done) {
				stderr += chunk.toString();
				done();
			},
		});

		await this.docker.pull(image);

		await this.docker.run(
			image,
			cmd,
			[outStream, errStream],
			{
				Tty: false,
				HostConfig: {
					AutoRemove: false,
				},
				Env: Object.entries(env || {}).map(
					([key, value]) => `${key}=${value}`
				),
			},
			{}
		);

		stderr;

		return JSON.parse(stdout);
	}
}
