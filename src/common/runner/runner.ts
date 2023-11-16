import { instanceToPlain } from "class-transformer";
import { IExecuteFunctions } from "n8n-workflow";

import { Asset } from "../asset";
import { Collector } from "../collector";
import { NodeConnectionType } from "../connectionType";

import { DEFAULT_PRIORITY, Priority } from "./priority";

export abstract class Runner {
	constructor(
		public readonly name: string,
		public readonly priority: Priority = DEFAULT_PRIORITY,
		public readonly func: IExecuteFunctions,
		public readonly itemIndex: number
	) {}

	abstract __run(
		collector: Collector,
		assets: Asset[]
	): Asset[] | Promise<Asset[]>;

	async run(collector: Collector, assets: Asset[]): Promise<Asset[]> {
		assets.forEach((a) => (a.success = false));
		const { index } = this.func.addInputData(
			NodeConnectionType.Runner as any,
			[
				assets.map((a) => ({
					json: instanceToPlain(a),
				})),
			]
		);

		let resp = await this.__run(collector, assets);

		const onlySuccess = this.func.getNodeParameter(
			"onlySuccess",
			index,
			true
		) as boolean;

		if (onlySuccess) {
			resp = resp.filter((a) => a.success);
		}

		this.func.addOutputData(NodeConnectionType.Runner as any, index, [
			resp.map((a) => ({
				json: instanceToPlain(a),
			})),
		]);

		return resp;
	}
}
