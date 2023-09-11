export const IMAGE = "registry.yoshino-s.xyz/yoshino-s/soar-image:dev";

export interface Runner {
	run<T extends string>(
		cmd: string[],
		env?: Record<string, string>,
		collectedFiles?: Record<T, string>
	): Promise<{
		stdout?: string;
		stderr?: string;
		err?: string;
		files?: Record<T, string>;
	}>;
}
