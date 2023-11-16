import { Asset } from "../asset";
import { Collector } from "../collector";

import { Runner } from "./runner";

export class PriorityRunner extends Runner {
	constructor(private readonly parentRunner: Runner, priority: number) {
		super(
			parentRunner.name,
			priority,
			parentRunner.func,
			parentRunner.itemIndex
		);
	}
	__run(collector: Collector, assets: Asset[]) {
		return assets;
	}
	run(collector: Collector, assets: Asset[]): Promise<Asset[]> {
		// bypass set input/output in priority runner node
		return this.parentRunner.run(collector, assets);
	}
}
