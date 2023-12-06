import {
	IAllExecuteFunctions,
	ICredentialDataDecryptedObject,
	NodeOperationError,
} from "n8n-workflow";
import { RedisClientOptions, RedisClientType, createClient } from "redis";

import { MemorizerStorage } from "../abstract.memorizer";

export class RedisStorage<T = any> implements MemorizerStorage<T> {
	client: RedisClientType;
	connectPromise: Promise<unknown>;
	constructor(
		func: IAllExecuteFunctions,
		credentials: ICredentialDataDecryptedObject,
		private readonly key: string,
		private readonly ttl: number,
	) {
		const redisOptions: RedisClientOptions = {
			socket: {
				host: credentials.host as string,
				port: credentials.port as number,
			},
			database: credentials.database as number,
		};

		if (credentials.password) {
			redisOptions.password = credentials.password as string;
		}

		this.client = createClient(redisOptions) as RedisClientType;

		this.client.on("error", async (error: Error) => {
			await this.client.quit();
			throw new NodeOperationError(
				func.getNode(),
				"Redis Error: " + error.message,
			);
		});

		this.connectPromise = this.client.connect();
	}

	private async connect() {
		await this.connectPromise;
	}

	async set(key: string, value: T) {
		await this.connect();

		if (this.ttl > 0) {
			this.client.setEx(
				`${this.key}:${key}`,
				this.ttl,
				JSON.stringify(value),
			);
		} else {
			this.client.set(`${this.key}:${key}`, JSON.stringify(value));
		}
	}
	async get(key: string): Promise<T | null> {
		await this.connect();

		const resp = await this.client.get(`${this.key}:${key}`);
		if (!resp) {
			return null;
		} else {
			return JSON.parse(resp);
		}
	}
}
