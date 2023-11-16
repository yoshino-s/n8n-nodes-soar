import { Writable } from "stream";

import Dockerode from "dockerode";
import {
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	NodeOperationError,
} from "n8n-workflow";

import { Executor, ExecutorResult } from "./executor";

export class DockerExecutor extends Executor {
	docker: Dockerode;
	constructor(
		credentials: ICredentialDataDecryptedObject,
		func: IExecuteFunctions,
	) {
		super(func);
		if (credentials === undefined) {
			throw new NodeOperationError(
				func.getNode(),
				new Error("No credentials got returned!"),
			);
		}
		this.docker = new Dockerode(credentials);
	}

	async __run<T extends string = string>(
		cmd: string[],
		image: string,
		env?: Record<string, string>,
	): Promise<ExecutorResult<T>> {
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

		let container: Dockerode.Container;

		const containers = (
			await this.docker.listContainers({
				filters: '{"label": ["managed-by=n8n-nodes-soar"]}',
			})
		).filter((n) => n.Image === image);

		if (containers.length === 0) {
			this.func.logger.info(`Boot new container for image ${image}`);
			container = await this.docker.createContainer({
				Image: image,
				Cmd: ["sleep", "infinity"],
				Labels: {
					"managed-by": "n8n-nodes-soar",
				},
			});
			await container.start();
		} else {
			container = this.docker.getContainer(containers[0].Id);
		}

		this.func.logger.debug(`Running ${cmd.join(" ")}`);

		const exec = await container.exec({
			AttachStderr: true,
			AttachStdout: true,
			Env: Object.entries(env || {}).map(
				([key, value]) => `${key}=${value}`,
			),
			Tty: false,
			Cmd: cmd,
		});

		const pipe = await exec.start({});
		this.docker.modem.demuxStream(pipe, outStream, errStream);

		await new Promise((resolve) => {
			pipe.on("end", resolve);
		});

		if (stderr !== "") {
			throw new NodeOperationError(
				this.func.getNode(),
				new Error(stderr),
			);
		}

		this.func.logger.debug(`Result ${stdout}`);

		return JSON.parse(stdout);
	}
}
