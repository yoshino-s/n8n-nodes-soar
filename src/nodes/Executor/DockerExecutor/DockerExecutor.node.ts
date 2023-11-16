import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { NodeConnectionType } from "@/common/connectionType";
import { DockerExecutor as Executor } from "@/common/executor/docker.executor";

export class DockerExecutor implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Docker Executor",
		name: "dockerExecutor",
		icon: "file:docker.svg",
		group: ["transform"],
		version: 1,
		description: "Execute with Docker",
		defaults: {
			name: "Docker",
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Executor] as any,
		credentials: [
			{
				name: "dockerApi",
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
				await this.getCredentials("dockerApi", itemIndex),
				this,
			),
		};
	}
}
