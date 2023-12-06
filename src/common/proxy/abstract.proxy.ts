import { FunctionsBase } from "n8n-workflow";

export interface ProxyableInstance {
	func: FunctionsBase;
}

export type ProxyFunction<T extends ProxyableInstance> = (i: T) => T;
