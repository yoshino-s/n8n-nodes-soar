import { Asset } from "../asset";
import { IRunnerData } from "../interface";

import { GeneralMemorizer } from "./general.memorizer";

export class AssetMemorizer extends GeneralMemorizer<Asset> {
	hash(data: IRunnerData<Asset>): string {
		return "asset:" + super.hash(data.json.basic);
	}
}
