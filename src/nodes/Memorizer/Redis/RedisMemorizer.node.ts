import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from "n8n-workflow";

import { NodeConnectionType } from "@/common/connectionType";
import { AbstractMemorizer } from "@/common/memorizer/abstract.memorizer";
import { AssetMemorizer } from "@/common/memorizer/asset.memorizer";
import { GeneralMemorizer } from "@/common/memorizer/general.memorizer";
import { RedisStorage } from "@/common/memorizer/storage/redis.storage";
import { proxyMemorizer } from "@/common/proxy/memorizer.proxy";

export class RedisMemorizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Memorizer: Redis",
		name: "redisMemorizer",
		icon: "file:redis.svg",
		group: ["transform"],
		codex: {
			alias: ["Redis"],
			categories: ["SOAR"],
			subcategories: {
				SOAR: ["memorizer"],
			},
		},
		version: 1,
		description: "Remember the data in redis",
		defaults: {
			name: "Redis Memorizer",
		},
		credentials: [
			{
				name: "redis",
				required: true,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.Memorizer] as any,
		properties: [
			{
				displayName: "Memorize Mode",
				name: "mode",
				type: "options",
				default: "general",
				options: [
					{
						name: "General",
						value: "general",
						description: "General mode",
					},
					{
						name: "Asset",
						value: "asset",
						description: "Asset mode",
					},
				],
			},
			{
				displayName: "Key Prefix",
				name: "keyPrefix",
				type: "string",
				default: "cache",
				required: true,
			},
			{
				displayName: "TTL",
				name: "ttl",
				type: "number",
				default: 0,
				description: "Time to live in seconds, <= 0 represent forever",
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
		const mode = this.getNodeParameter(
			"mode",
			itemIndex,
			"general",
		) as string;
		const credentials = await this.getCredentials("redis");
		const keyPrefix = this.getNodeParameter(
			"keyPrefix",
			itemIndex,
			"cache",
		) as string;
		const ttl = this.getNodeParameter("ttl", itemIndex, 3600) as number;
		const storage = new RedisStorage(this, credentials, keyPrefix, ttl);
		let memorizer: AbstractMemorizer<any>;
		if (mode === "asset") {
			memorizer = new AssetMemorizer(this, itemIndex, storage);
		} else {
			memorizer = new GeneralMemorizer(this, itemIndex, storage);
		}

		return {
			response: proxyMemorizer(memorizer),
		};
	}
}
