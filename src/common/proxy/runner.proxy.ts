import { instanceToPlain } from "class-transformer";

import { Asset } from "../asset";
import { Collector } from "../collector";
import { NodeConnectionType } from "../connectionType";
import { IRunnerData } from "../interface";
import { getAssetRunner, getOnlySuccess } from "../runner/decorator";
import { AbstractRunner } from "../runner/runner";

import { ProxyFunction } from "./abstract.proxy";

export const proxyRunner: ProxyFunction<AbstractRunner> = (i) => {
	return new Proxy(i, {
		get: (target, prop, receiver) => {
			if (prop === "run") {
				const f = Reflect.get(target, prop, receiver);
				const func = Reflect.get(target, "func", receiver);
				const itemIndex = Reflect.get(target, "itemIndex", receiver);
				const onlySuccess = func.getNodeParameter(
					"onlySuccess",
					itemIndex,
					false,
				) as boolean;
				const debugMode = func.getNodeParameter(
					"debug",
					itemIndex,
					false,
				) as boolean;

				async function wrap(
					this: AbstractRunner,
					collector: Collector,
					inputs: IRunnerData<any>[],
				): Promise<IRunnerData<any>[]> {
					let index: number = 0;
					if (debugMode) {
						index = func.addInputData(
							NodeConnectionType.Runner as any,
							[
								func.helpers.returnJsonArray(
									instanceToPlain(inputs),
								),
							],
						).index;
						func.logger.debug(
							`Input: ${index} ${JSON.stringify(
								inputs.map((n) => n.json),
							)}`,
						);
					}

					if (getAssetRunner(this)) {
						inputs.forEach((n) => {
							n.json = Asset.fromPlain(n.json);
						});
					}

					if (getOnlySuccess(this.constructor) && onlySuccess) {
						inputs.forEach((a) => {
							a.success = false;
						});
					}

					let resp = await f.call(this, collector, inputs);

					if (getOnlySuccess(this.constructor) && onlySuccess) {
						resp = resp.filter((a) => a.success);
					}

					if (debugMode) {
						func.addOutputData(
							NodeConnectionType.Runner as any,
							index,
							[resp as any],
						);
						func.logger.debug(
							`Output: ${index} ${JSON.stringify(
								resp.map((n) => n.json),
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
