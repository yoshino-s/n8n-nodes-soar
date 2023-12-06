import { Writable } from "stream";

import * as k8s from "@kubernetes/client-node";
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

export class KubernetesExecutor extends AbstractExecutor {
	podName?: string;

	kubeConfig: k8s.KubeConfig;
	constructor(
		private readonly namespace: string,
		private readonly image: string,
		credentials: ICredentialDataDecryptedObject,
		func: IExecuteFunctions,
	) {
		super(func);
		const kubeConfig = new k8s.KubeConfig();
		switch (credentials.loadFrom) {
			case "automatic":
				kubeConfig.loadFromDefault();
				break;
			case "file":
				if (
					typeof credentials.filePath !== "string" ||
					credentials.filePath === ""
				) {
					throw new NodeOperationError(
						func.getNode(),
						new Error("File path not set!"),
					);
				}
				kubeConfig.loadFromFile(credentials.filePath);
				break;
			case "content":
				if (
					typeof credentials.content !== "string" ||
					credentials.content === ""
				) {
					throw new NodeOperationError(
						func.getNode(),
						new Error("Content not set!"),
					);
				}
				kubeConfig.loadFromString(credentials.content);
				break;
			default:
				throw new NodeOperationError(
					func.getNode(),
					new Error("Load from value not set!"),
				);
		}
		this.kubeConfig = kubeConfig;
	}

	setPodName(podName: string) {
		this.podName = podName;
	}

	acquirePodName() {
		if (!this.podName) {
			throw new NodeOperationError(
				this.func.getNode(),
				"Pod name is not ready",
			);
		}
		return this.podName;
	}

	async listNamespaces(): Promise<string[]> {
		const kc = this.kubeConfig;

		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

		return (await k8sCoreApi.listNamespace()).body.items.map(
			(n) => n.metadata?.name ?? "",
		);
	}

	async listPods(): Promise<string[]> {
		const kc = this.kubeConfig;

		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

		const pods = (
			await k8sCoreApi.listNamespacedPod(
				this.namespace,
				undefined,
				undefined,
				undefined,
				undefined,
				"managed-by=n8n-nodes-soar",
			)
		).body.items;

		return pods
			.filter(
				(n) =>
					(n.status?.phase === "Running" ||
						n.status?.phase === "Pending") &&
					n.spec?.containers[0].image === this.image,
			)
			.map((n) => n.metadata?.name ?? "");
	}

	async preparePod(): Promise<string> {
		const { image, namespace } = this;

		const pods = await this.listPods();

		if (pods.length === 0) {
			const podName = `n8n-soar-pod-${Date.now()}`;

			this.func.logger.info(`Boot new pod for image ${image}`);

			const podSpec: k8s.V1Pod = {
				metadata: {
					name: podName,
					namespace,
					labels: {
						"managed-by": "n8n-nodes-soar",
					},
				},
				spec: {
					restartPolicy: "Always",
					containers: [
						{
							name: "main-container",
							image,
							imagePullPolicy: "Always",
							args: ["sleep", "infinity"],
							lifecycle: {},
						},
					],
				},
			};

			const kc = this.kubeConfig;

			const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

			await k8sCoreApi.createNamespacedPod(this.namespace, podSpec);

			return podName;
		} else {
			return pods[0];
		}
	}

	async run(
		cmd: string[],
		options?: ExecutorRunOptions,
	): Promise<ExecutorRunResult> {
		const { namespace } = this;
		const kc = this.kubeConfig;

		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

		const name = this.acquirePodName();

		const pod = (await k8sCoreApi.readNamespacedPod(name, namespace)).body;

		// if is in initial
		if (pod.status?.phase === "Pending") {
			while (true) {
				const pod = (
					await k8sCoreApi.readNamespacedPod(name, namespace)
				).body;

				if (pod.status?.phase === "Running") {
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		// exec into pod and get stdout/stderr

		const exec = new k8s.Exec(kc);

		const stdout = new Writable();

		let stdoutString = "";

		stdout._write = (chunk, encoding, next) => {
			stdoutString += chunk.toString();
			next();
		};

		const stderr = new Writable();

		let stderrString = "";

		stderr._write = (chunk, encoding, next) => {
			stderrString += chunk.toString();
			next();
		};

		await new Promise(async (resolve, reject) => {
			exec.exec(
				namespace,
				name,
				"main-container",
				[
					"env",
					...(options?.env?.flatMap((v) => ["-e", v]) ?? []),
					...cmd,
				],
				stdout,
				stderr,
				null,
				false,
				(s) => {
					switch (s.status) {
						case "Failure":
							console.log(stderrString, stdoutString);
							reject(new Error(s.message));
							break;
						case "Success":
							resolve(undefined);
							break;
					}
				},
			).catch(reject);
		});

		return {
			stdout: stdoutString,
			stderr: stderrString,
		};
	}
}
