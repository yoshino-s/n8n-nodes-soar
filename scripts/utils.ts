export function toCamelCase(s: string, upperFirst = false) {
	s = s
		.toLocaleLowerCase()
		.replace(/([-_][a-z])/gi, ($1) =>
			$1.toUpperCase().replace("-", "").replace("_", "")
		);
	if (upperFirst) {
		s = s.charAt(0).toUpperCase() + s.slice(1);
	} else {
		s = s.charAt(0).toLowerCase() + s.slice(1);
	}
	return s;
}

const specialCase = {
	CDN: /cdn/i,
	URL: /url/i,
	IP: /ip/i,
	ID: /id/i,
	JSON: /json/i,
};

export function toDisplayName(s: string) {
	let r = toCamelCase(s)
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (str) => str.toUpperCase());

	for (const [k, v] of Object.entries(specialCase)) {
		r = r.replace(v, k);
	}
	return r;
}
