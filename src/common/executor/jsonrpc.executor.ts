import {
	ICredentialDataDecryptedObject,
	IExecuteFunctions,
	NodeOperationError,
} from "n8n-workflow";
import { WebSocket } from "ws";

import { AbstractExecutor } from "./abstract.executor";

export class JSONRPCError extends Error {
	constructor(code: number, message: string, data: any) {
		super(`${code}: ${message} ${data ? JSON.stringify(data) : ""}`);
		this.name = "JSONRPCError";
	}
}

export class JSONRPCExecutor extends AbstractExecutor {
	callbackMap: Map<number, (n: any, e?: JSONRPCError) => void> = new Map();
	ws: WebSocket;
	constructor(
		credentials: ICredentialDataDecryptedObject,
		func: IExecuteFunctions,
	) {
		super(func);
		const ws = new WebSocket((credentials.url as string) + "/jsonrpc", {
			headers: {
				Authorization: `Basic ${Buffer.from(
					`${credentials.username}:${credentials.password}`,
				).toString("base64")}`,
			},
		});
		ws.on("error", (e) => {
			throw new NodeOperationError(this.func.getNode(), e);
		});
		ws.on("message", (data) => {
			const res = JSON.parse(data.toString());
			const callback = this.callbackMap.get(res.id);
			if (callback) {
				if (res.error) {
					callback(
						res.result,
						new JSONRPCError(
							res.error.code,
							res.error.message,
							res.error.data,
						),
					);
				} else {
					callback(res.result);
				}
			}
		});
		this.ws = ws;
	}

	private wait() {
		if (this.ws.readyState === WebSocket.OPEN) {
			return Promise.resolve(undefined);
		}
		return new Promise((resolve) => {
			this.ws.on("open", () => {
				resolve(undefined);
			});
		});
	}

	private id(): number {
		return Math.floor(Math.random() * 1000000000);
	}

	private async invoke(method: string, params: any): Promise<any> {
		await this.wait();
		return new Promise((resolve, reject) => {
			const id = this.id();
			this.callbackMap.set(id, (n, e) => {
				if (e) {
					reject(e);
				} else {
					resolve(n);
				}
			});
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}

	private listMethods(): Promise<string[]> {
		return this.invoke("system.ListMethods", []);
	}

	private getMethod(method: string): Promise<any> {
		return this.invoke("system.GetMethod", [method]);
	}

	run(
		cmd: string[],
		options?: {
			env?: string[];
			ignoreStdout?: boolean;
			ignoreStderr?: boolean;
		},
	): Promise<{ stdout: string; stderr: string }> {
		return this.invoke("Run", [cmd, options ?? {}]);
	}

	readFile(path: string): Promise<string> {
		return this.invoke("ReadFile", [path]);
	}

	writeFile(path: string, content: string): Promise<void> {
		return this.invoke("WriteFile", [path, content]);
	}
}
