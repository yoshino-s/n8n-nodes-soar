import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	SupplyData,
} from "n8n-workflow";

import { Asset } from "@/common/asset";
import { Collector } from "@/common/collector";
import { NodeConnectionType } from "@/common/connectionType";
import { IRunnerData } from "@/common/interface";
import { proxyRunner } from "@/common/proxy/runner.proxy";
import {
	AssetRunner,
	BANNER_RUNNER_PRIORITY,
	Priority,
} from "@/common/runner/decorator";
import { AbstractRunner } from "@/common/runner/runner";

@Priority(BANNER_RUNNER_PRIORITY)
@AssetRunner
class IcpLookupRunner extends AbstractRunner<Asset> {
	async run(
		collector: Collector,
		inputs: IRunnerData<Asset>[],
	): Promise<IRunnerData<Asset>[]> {
		const assets = inputs.map((n) => n.json);
		const api = this.func.getNodeParameter("api", this.itemIndex) as string;

		const rootDomains = assets.map((n) => {
			if (typeof n.metadata?.rootDomain === "string") {
				return n.metadata.rootDomain;
			} else {
				const host = n.getDomain().split(".");
				const result = [];
				result.push(host.pop()); // last one must be

				const valid_suffix = ["com", "cn", "edu", "org", "gov"];

				while (true) {
					const last = host.pop() ?? "";
					result.push(last);
					if (!valid_suffix.includes(last)) {
						break;
					}
				}

				return result.reverse().join(".");
			}
		});

		const resp = await this.func.helpers.httpRequest.bind(this.func)({
			method: "POST",
			url: api,
			body: {
				host: Array.from(new Set(rootDomains)).join(","),
			},
		});

		if (resp.code !== 0) {
			throw new NodeApiError(this.func.getNode(), resp);
		}

		const result: Record<string, any> = {};
		resp.data.forEach((n: any) => {
			result[n.host] = n;
		});

		const ignorePersonal = this.func.getNodeParameter(
			"ignorePersonal",
			this.itemIndex,
		) as boolean;

		return inputs.map((n, index) => {
			const host = rootDomains[index];
			const res = result[host];
			if (
				res &&
				res.typ !== "INVALID" &&
				(!ignorePersonal || res.typ !== "个人")
			) {
				n.json.metadata = {
					...n.json.metadata,
					icp: res,
				};
				n.success = true;
			}
			return n;
		});
	}
}

export class IcpLookup implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Runner: IcpLookup",
		name: "icpLookup",
		icon: "file:icp.svg",
		group: ["transform"],
		codex: {
			alias: ["IcpLookup"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["runner"],
			},
		},
		version: 1,
		description: "lookup icp for asset",
		defaults: {
			name: "Icp Lookup",
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Runner] as any,
		properties: [
			{
				displayName: "Only Success",
				name: "onlySuccess",
				type: "boolean",
				default: true,
			},
			{
				displayName: "Icp API",
				name: "api",
				type: "string",
				default: "",
				required: true,
			},
			{
				displayName: "Ignore Personal",
				name: "ignorePersonal",
				type: "boolean",
				default: true,
			},
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
			response: [proxyRunner(new IcpLookupRunner(this, itemIndex))],
		};
	}
}
