import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { NodeConnectionType } from "@/common/connectionType";
import { K8sExecutor as Executor } from "@/common/executor/k8s.executor";

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
			},
		],
		properties: [],
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		return {
			response: new Executor(
				await this.getCredentials("kubernetesApi", itemIndex),
				this,
			),
		};
	}
}
