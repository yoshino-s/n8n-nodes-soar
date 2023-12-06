import { IBinaryKeyData } from "n8n-workflow";

export type MaybePromise<T> = T | Promise<T>;

export interface IRunnerData<T> {
	json: T;
	binary?: IBinaryKeyData;
	success?: boolean;
	sourceInputIndex: number;
}
