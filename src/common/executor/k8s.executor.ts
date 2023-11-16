import { Writable } from "stream";

import * as k8s from "@kubernetes/client-node";
import {
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	NodeOperationError,
} from "n8n-workflow";

import { Executor, ExecutorResult } from "./executor";

export class K8sExecutor extends Executor {
	kubeConfig: k8s.KubeConfig;
	constructor(
		credentials: ICredentialDataDecryptedObject,
		func: IExecuteFunctions
	) {
		super(func);
		if (credentials === undefined) {
			throw new NodeOperationError(
				func.getNode(),
				new Error("No credentials got returned!")
			);
		}
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
						new Error("File path not set!")
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
						new Error("Content not set!")
					);
				}
				kubeConfig.loadFromString(credentials.content);
				break;
			default:
				throw new NodeOperationError(
					func.getNode(),
					new Error("Load from value not set!")
				);
		}
		this.kubeConfig = kubeConfig;
	}
	async __run<T extends string = string>(
		cmd: string[],
		image: string,
		env?: Record<string, string>
	): Promise<ExecutorResult<T>> {
		const kc = this.kubeConfig;

		const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

		const pods = (
			await k8sCoreApi.listNamespacedPod(
				"default",
				undefined,
				undefined,
				undefined,
				undefined,
				"managed-by=n8n-nodes-soar"
			)
		).body.items.filter(
			(n) =>
				(n.status?.phase === "Running" ||
					n.status?.phase === "Pending") &&
				n.spec?.containers[0].image === image
		);

		let pod: k8s.V1Pod | undefined = undefined;

		const namespace = "default";

		if (pods.length > 0) {
			pod = pods[0];
		} else {
			const podName = `n8n-soar-pod-${Date.now()}`;

			const podSpec: k8s.V1Pod = {
				metadata: {
					name: podName,
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
			this.func.logger.debug("Creating pod " + JSON.stringify(podSpec));

			const resp = await k8sCoreApi.createNamespacedPod(
				namespace,
				podSpec
			);

			pod = resp.body;
		}

		const name = pod.metadata?.name;

		if (!name) {
			throw new Error("Pod name not set!");
		}

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

		this.func.logger.debug(`Running ${cmd.join(" ")}`);

		await new Promise(async (resolve, reject) => {
			exec.exec(
				namespace,
				name,
				"main-container",
				[
					"env",
					...Object.entries(env || {}).flatMap(([k, v]) => [
						"-e",
						`${k}=${v}`,
					]),
					...cmd,
				],
				stdout,
				stderr,
				null,
				false,
				(s) => {
					switch (s.status) {
						case "Failure":
							reject(s.message);
							break;
						case "Success":
							resolve(undefined);
							break;
					}
				}
			).catch(reject);
		});

		stderrString;

		if (stderrString !== "") {
			throw new NodeOperationError(
				this.func.getNode(),
				new Error(stderrString)
			);
		}

		this.func.logger.debug(`Result ${stdoutString}`);

		return JSON.parse(stdoutString);
	}
}
