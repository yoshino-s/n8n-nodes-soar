import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { NodeConnectionType } from "@/common/connectionType";
import { PriorityRunner } from "@/common/runner/priority.runner";
import { Runner } from "@/common/runner/runner";

export class Priority implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Priority Modify",
		icon: "fa:exchange-alt",
		name: "priority",
		group: ["output"],
		version: 1,
		codex: {
			alias: ["Priority"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
		},
		description: "modify runner priority",
		defaults: {
			name: "Priority Modify",
		},
		subtitle: '={{$parameter["mode"]}} {{$parameter["priority"]}}',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [NodeConnectionType.Runner] as any,
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Runner] as any,
		properties: [
			{
				displayName: "Mode",
				name: "mode",
				type: "options",
				default: "increase",
				options: [
					{
						name: "Increase",
						value: "increase",
					},
					{
						name: "Decrease",
						value: "decrease",
					},
					{
						name: "Set",
						value: "set",
					},
				],
			},
			{
				displayName: "Priority",
				name: "priority",
				type: "number",
				default: 0,
			},
		],
	};

	async supplyData(
		this: IExecuteFunctions,
		itemIndex: number
	): Promise<SupplyData> {
		const runners = (
			(await this.getInputConnectionData(
				NodeConnectionType.Runner as any,
				itemIndex
			)) as Runner[][]
		).flat();
		const mode = this.getNodeParameter("mode", itemIndex) as
			| "increase"
			| "decrease"
			| "set";
		const p = this.getNodeParameter("priority", itemIndex) as number;
		const modifyFunc = (priority: number) => {
			switch (mode) {
				case "increase":
					return priority + p;
				case "decrease":
					return priority - p;
				case "set":
					return p;
			}
		};
		return {
			response: runners.map(
				(r) => new PriorityRunner(r, modifyFunc(r.priority))
			),
		};
	}
}
