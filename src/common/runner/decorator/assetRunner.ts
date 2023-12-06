import { OnlySuccess } from "./onlySuccess";

import { declareClassDecorator } from "@/utils/decorator";

const [_AssetRunner, _getAssetRunner] = declareClassDecorator(
	"assetRunner",
	false,
);

export const AssetRunner: ClassDecorator = (t) => {
	_AssetRunner(true)(t);
	OnlySuccess(true)(t);
};

export const getAssetRunner = _getAssetRunner;
