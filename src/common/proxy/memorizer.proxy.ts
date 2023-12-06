import { NodeConnectionType } from "../connectionType";
import { AbstractMemorizer } from "../memorizer/abstract.memorizer";

import { ProxyFunction } from "./abstract.proxy";

export const proxyMemorizer: ProxyFunction<AbstractMemorizer> = (i) => {
	return new Proxy(i, {
		get: (target, prop, receiver) => {
			if (
				["load", "save", "batchLoad", "batchSave"].includes(
					prop.toString(),
				)
			) {
				const f = Reflect.get(target, prop, receiver) as (
					...args: any[]
				) => any;
				const func = Reflect.get(target, "func", receiver);
				const itemIndex = Reflect.get(target, "itemIndex", receiver);

				const debugMode = func.getNodeParameter(
					"debug",
					itemIndex,
					false,
				) as boolean;

				async function wrap(
					this: AbstractMemorizer,
					...args: any[]
				): Promise<any> {
					let index: number = 0;

					if (debugMode) {
						index = func.addInputData(
							NodeConnectionType.Executor as any,
							[
								func.helpers.returnJsonArray({
									call: prop.toString(),
									arguments: args,
								}),
							],
						).index;
						func.logger.debug(
							`Input: ${index} ${prop.toString()} ${JSON.stringify(
								args,
							)}`,
						);
					}
					const resp = await f.apply(target, args);

					if (debugMode) {
						func.addOutputData(
							NodeConnectionType.Executor as any,
							index,
							[func.helpers.returnJsonArray(resp)],
						);
						func.logger.debug(
							`Output: ${index} ${prop.toString()} ${JSON.stringify(
								resp,
							)}`,
						);
					}

					return resp;
				}
				return wrap.bind(target);
			} else {
				return Reflect.get(target, prop, receiver);
			}
		},
	});
};
