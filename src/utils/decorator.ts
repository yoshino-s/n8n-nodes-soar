export function declareClassDecorator<T>(
	name: string,
	defaultValue: T,
): [(v?: T) => ClassDecorator, (v: any) => T] {
	return [
		(value) => (target) =>
			Reflect.defineMetadata(name, value ?? defaultValue, target),
		(target) => {
			if (target instanceof Function) {
				return Reflect.getMetadata(name, target) ?? defaultValue;
			} else {
				return (
					Reflect.getMetadata(name, target.constructor) ??
					defaultValue
				);
			}
		},
	];
}
