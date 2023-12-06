import { declareClassDecorator } from "@/utils/decorator";

export const [OnlySuccess, getOnlySuccess] = declareClassDecorator(
	"onlySuccess",
	false,
);
