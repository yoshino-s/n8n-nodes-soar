import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { NodeConnectionType } from "@/common/connectionType";
import { JSONRPCExecutor } from "@/common/executor/jsonrpc.executor";
import { proxyExecutor } from "@/common/proxy/executor.proxy";

export class JsonRpcExecutor implements INodeType {
	description: INodeTypeDescription = {
		displayName: "JSONRPC Executor",
		name: "jsonRpcExecutor",
		icon: "file:icon.svg",
		group: ["transform"],
		version: 1,
		description: "Execute with JSONRPC",
		defaults: {
			name: "JSONRPC",
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Executor] as any,
		credentials: [
			{
				name: "soarRunnerApi",
				required: true,
			},
		],
		properties: [
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

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		return {
			response: proxyExecutor(
				new JSONRPCExecutor(
					await this.getCredentials("soarRunnerApi", itemIndex),
					this,
				),
			),
		};
	}
}
