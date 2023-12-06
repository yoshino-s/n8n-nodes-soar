import type {
	ILoadOptionsFunctions,
	INodeListSearchResult,
} from "n8n-workflow";
import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { NodeConnectionType } from "@/common/connectionType";
import { KubernetesExecutor as Executor } from "@/common/executor/kubernetes.executor";
import { proxyExecutor } from "@/common/proxy/executor.proxy";
import { IMAGE } from "@/constants/image";

export class KubernetesExecutor implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Kubernetes Executor",
		name: "kubernetesExecutor",
		icon: "file:k8s.svg",
		group: ["transform"],
		version: 1,
		description: "Execute with Kubernetes",
		defaults: {
			name: "Kubernetes",
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Executor] as any,
		credentials: [
			{
				name: "kubernetesApi",
				required: true,
			},
		],
		properties: [
			{
				displayName: "Image",
				name: "image",
				type: "string",
				default: IMAGE,
				required: true,
				description: "Docker image to use",
			},
			{
				displayName: "Namespace",
				name: "namespace",
				type: "resourceLocator",
				default: { mode: "list", value: "" },
				required: true,
				modes: [
					{
						displayName: "Namespace",
						name: "list",
						type: "list",
						placeholder: "Select a namespace...",
						typeOptions: {
							searchListMethod: "namespaceSearch",
						},
					},
				],
			},
			{
				displayName: "Stateless",
				name: "stateless",
				type: "boolean",
				default: true,
				description:
					"Whether to use a stateless pod, which mean we will use any pod that is available. If false, we will use the same pod for all executions.",
			},
			{
				displayName: "Pod",
				name: "pod",
				type: "resourceLocator",
				default: { mode: "list", value: "" },
				required: true,
				modes: [
					{
						displayName: "Pod",
						name: "list",
						type: "list",
						placeholder: "Select a pod...",
						typeOptions: {
							searchListMethod: "podSearch",
						},
					},
				],
				displayOptions: {
					show: {
						stateless: [false],
					},
				},
			},
			{
				displayName: "Debug Mode",
				name: "debug",
				type: "boolean",
				default: false,
				description:
					"Whether open to see more information in node input & output",
			},
		],
	};

	methods = {
		listSearch: {
			async namespaceSearch(
				this: ILoadOptionsFunctions,
				_filter?: string,
			): Promise<INodeListSearchResult> {
				const executor = new Executor(
					this.getNodeParameter("namespace") as string,
					this.getNodeParameter("image") as string,
					await this.getCredentials("kubernetesApi"),
					this as any,
				);
				const namespaces = await executor.listNamespaces();
				return {
					results: namespaces.map((namespace) => ({
						name: namespace,
						value: namespace,
					})),
				};
			},
			async podSearch(
				this: ILoadOptionsFunctions,
				_filter?: string,
			): Promise<INodeListSearchResult> {
				const { value: namespace } = this.getNodeParameter(
					"namespace",
				) as {
					value: string;
				};

				const executor = new Executor(
					namespace,
					this.getNodeParameter("image") as string,
					await this.getCredentials("kubernetesApi"),
					this as any,
				);
				const pods = await executor.listPods();
				return {
					results: pods.map((pod) => ({
						name: pod,
						value: pod,
					})),
				};
			},
		},
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		const { value: namespace } = this.getNodeParameter(
			"namespace",
			itemIndex,
		) as {
			value: string;
		};
		const executor = new Executor(
			namespace,
			this.getNodeParameter("image", itemIndex) as string,
			await this.getCredentials("kubernetesApi", itemIndex),
			this,
		);

		if (this.getNodeParameter("stateless", itemIndex) as boolean) {
			executor.setPodName(await executor.preparePod());
		} else {
			const { value } = this.getNodeParameter("pod", itemIndex) as {
				value: string;
			};
			executor.setPodName(value);
		}

		return {
			response: proxyExecutor(executor),
		};
	}
}
