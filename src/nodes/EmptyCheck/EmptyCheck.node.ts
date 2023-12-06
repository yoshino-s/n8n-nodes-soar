import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from "n8n-workflow";

export class EmptyCheck implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Empty Check",
		name: "emptyCheck",
		group: ["transform"],
		version: 1,
		icon: "fa:dot-circle",

		description: "Check if previous node returned empty result",
		defaults: {
			name: "Empty Check",
			color: "#FF0000",
		},
		inputs: ["main"],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: ["main", "main"],
		outputNames: ["Result", "IsEmpty"],
		credentials: [],
		properties: [],
	};
	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][]> {
		const all = this.getInputData();
		if (
			all.length === 1 &&
			JSON.stringify(all[0].json) === "{}" &&
			all[0].binary === undefined
		) {
			return [[], all];
		} else {
			return [all, []];
		}
	}
}
