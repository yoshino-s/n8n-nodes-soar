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
import { DockerExecutor as Executor } from "@/common/executor/docker.executor";
import { proxyExecutor } from "@/common/proxy/executor.proxy";
import { IMAGE } from "@/constants/image";

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
				displayName: "Stateless",
				name: "stateless",
				type: "boolean",
				default: true,
				description:
					"Whether to use a stateless container, which mean we will use any container that is available. If false, we will use the same container for all executions.",
			},
			{
				displayName: "Container",
				name: "container",
				type: "resourceLocator",
				default: { mode: "list", value: "" },
				required: true,
				modes: [
					{
						displayName: "Container",
						name: "list",
						type: "list",
						placeholder: "Select a container...",
						typeOptions: {
							searchListMethod: "containerSearch",
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
			async containerSearch(
				this: ILoadOptionsFunctions,
				_filter?: string,
			): Promise<INodeListSearchResult> {
				const executor = new Executor(
					this.getNodeParameter("image") as string,
					await this.getCredentials("dockerApi"),
					this as any,
				);

				const containers = await executor.listContainers();

				return {
					results: containers.map((c) => ({
						name: c.Names.join(","),
						value: c.Id,
					})),
				};
			},
		},
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		const stateless = this.getNodeParameter(
			"stateless",
			itemIndex,
		) as boolean;

		const executor = new Executor(
			this.getNodeParameter("image", itemIndex) as string,
			await this.getCredentials("dockerApi", itemIndex),
			this,
		);

		if (stateless) {
			executor.setContainer(await executor.prepareContainer());
		} else {
			const { value } = this.getNodeParameter("container", itemIndex) as {
				value: string;
			};
			const container = await executor.findContainerByID(value);
			executor.setContainer(container);
		}

		return {
			response: proxyExecutor(executor),
		};
	}
}
