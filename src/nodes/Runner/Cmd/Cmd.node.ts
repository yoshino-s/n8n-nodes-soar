import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { Collector } from "@/common/collector";
import { NodeConnectionType } from "@/common/connectionType";
import { IRunnerData } from "@/common/interface";
import { proxyRunner } from "@/common/proxy/runner.proxy";
import {
	ContainerRunner,
	advancedOptions,
} from "@/common/runner/container.runner";
import { DEFAULT_PRIORITY, Priority } from "@/common/runner/decorator";

@Priority(DEFAULT_PRIORITY)
class CmdRunner extends ContainerRunner<any> {
	async run(collector: Collector): Promise<IRunnerData<any>[]> {
		const cmd = this.func.getNodeParameter(
			"cmd",
			this.itemIndex,
		) as string[];

		return this.constructData(-1, [
			await this.runCmd(collector, cmd, this.getOptions()),
		]);
	}
}

export class Cmd implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: Cmd",
		name: "cmd",
		icon: "fa:terminal",
		group: ["transform"],
		codex: {
			alias: ["Cmd"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
		},
		version: 1,
		description: "Run cmd",
		defaults: {
			name: "Cmd",
		},
		subtitle: '={{$parameter["cmd"]}}',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Runner] as any,
		properties: [
			{
				displayName: "Cmd",
				name: "cmd",
				type: "json",
				default: "={{['ls']}}",
				required: true,
			},
			...advancedOptions,
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
			response: [proxyRunner(new CmdRunner(this, itemIndex))],
		};
	}
}
