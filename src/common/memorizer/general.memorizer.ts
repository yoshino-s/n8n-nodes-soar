import { createHash } from "node:crypto";

import { AbstractMemorizer } from "./abstract.memorizer";

export class GeneralMemorizer<T = any> extends AbstractMemorizer<T> {
	hash(data: any): string {
		return createHash("md5").update(JSON.stringify(data)).digest("hex");
	}
}
