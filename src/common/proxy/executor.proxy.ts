import { NodeConnectionType } from "../connectionType";
import { AbstractExecutor } from "../executor/abstract.executor";

import { ProxyFunction } from "./abstract.proxy";

export const proxyExecutor: ProxyFunction<AbstractExecutor> = (i) => {
	return new Proxy(i, {
		get: (target, prop, receiver) => {
			if (
				(
					["run", "readFile", "writeFile"] as (string | symbol)[]
				).includes(prop)
			) {
				const f = Reflect.get(target, prop, receiver);
				const func = Reflect.get(target, "func", receiver);

				const itemIndex = Reflect.get(target, "itemIndex", receiver);
				const debugMode = func.getNodeParameter(
					"debug",
					itemIndex,
					false,
				) as boolean;

				async function wrap(
					this: AbstractExecutor,
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
					const resp = await f.apply(this, args);

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
