import { Writable } from "stream";

import Dockerode from "dockerode";
import {
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	NodeOperationError,
} from "n8n-workflow";

import {
	AbstractExecutor,
	ExecutorRunOptions,
	ExecutorRunResult,
} from "./abstract.executor";

export class DockerExecutor extends AbstractExecutor {
	readonly docker: Dockerode;
	private container?: Dockerode.Container;

	constructor(
		private readonly image: string,
		credentials: ICredentialDataDecryptedObject,
		func: IExecuteFunctions,
	) {
		super(func);
		this.docker = new Dockerode(credentials);
	}

	setContainer(container: Dockerode.Container) {
		this.container = container;
	}

	acquireContainer() {
		if (!this.container) {
			throw new NodeOperationError(
				this.func.getNode(),
				"Container is not ready",
			);
		}
		return this.container;
	}

	async listContainers() {
		return (
			await this.docker.listContainers({
				filters: '{"label": ["managed-by=n8n-nodes-soar"]}',
			})
		).filter((n) => n.Image === this.image);
	}

	async findContainerByID(id: string) {
		const containers = await this.listContainers();
		const r = containers.find((n) => n.Id === id);
		if (!r) {
			throw new NodeOperationError(
				this.func.getNode(),
				`Container ${id} not found`,
			);
		}
		return this.docker.getContainer(r.Id);
	}

	async prepareContainer(): Promise<Dockerode.Container> {
		const { image } = this;
		let container: Dockerode.Container;

		const containers = await this.listContainers();

		if (containers.length === 0) {
			this.func.logger.info(`Boot new container for image ${image}`);
			await this.docker.pull(image);

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

		return container;
	}

	async run(
		cmd: string[],
		options?: ExecutorRunOptions,
	): Promise<ExecutorRunResult> {
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

		const container = await this.acquireContainer();

		const exec = await container.exec({
			AttachStderr: !options?.ignoreStderr,
			AttachStdout: !options?.ignoreStdout,
			Env: options?.env,
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

		return { stdout, stderr };
	}
}
