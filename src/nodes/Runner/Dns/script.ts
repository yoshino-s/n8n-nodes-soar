import { DnsRecord } from "@/common/asset";

export type DnsQueryType =
	| "A"
	| "AAAA"
	| "CNAME"
	| "NS"
	| "PTR"
	| "ANY"
	| "MX"
	| "NAPTR"
	| "SOA"
	| "SRV"
	| "TXT";

const DNS_QUERY_TYPE_MAP: Record<DnsQueryType, number> = {
	A: 1,
	AAAA: 28,
	CNAME: 5,
	NS: 2,
	PTR: 12,
	ANY: 255,
	MX: 15,
	NAPTR: 35,
	SOA: 6,
	SRV: 33,
	TXT: 16,
};

export const DEFAULT_RESOLVERS = [
	"https://dns.alidns.com/resolve",
	"https://dns.google/resolve",
	"https://cloudflare-dns.com/dns-query",
];

export interface DnsOptions {
	queryTypes: DnsQueryType[];
	resolvers: string[];
	timeout: number;
}

async function resolveByDoH(
	host: string,
	resolver: string,
	queryType: string,
	signal: AbortSignal,
): Promise<DnsRecord> {
	const url = new URL(resolver);
	url.searchParams.append("name", host);
	url.searchParams.append("type", queryType);
	url.searchParams.append("ct", "application/dns-json");
	const response = await fetch(url.toString(), { signal });
	const data = await response.json();
	if (data.Status !== 0) {
		throw new Error(`DoH query failed: ${data}`);
	}
	return {
		[queryType]: data.Answer.filter(
			(n: any) =>
				n.type === DNS_QUERY_TYPE_MAP[queryType as DnsQueryType],
		).map((n: any) => n.data),
	};
}

function merge(results: DnsRecord[]): DnsRecord {
	const merged: DnsRecord = {};
	for (const result of results) {
		for (const [key, value] of Object.entries(result)) {
			if (merged[key]) {
				merged[key].push(...value);
			} else {
				merged[key] = value;
			}
		}
	}
	for (const [key, value] of Object.entries(merged)) {
		merged[key] = [...new Set(value)];
	}
	return merged;
}

export async function resolve(
	host: string,
	options: DnsOptions,
): Promise<DnsRecord> {
	const signal = AbortSignal.timeout(options.timeout);
	const results = (
		await Promise.allSettled(
			options.resolvers.flatMap((resolver) =>
				options.queryTypes.map((queryType) => {
					if (resolver.startsWith("https")) {
						return resolveByDoH(host, resolver, queryType, signal);
					} else {
						throw new Error(`Unsupported resolver: ${resolver}`);
					}
				}),
			),
		)
	)
		.map((n) => (n.status === "fulfilled" ? n.value : undefined))
		.filter(Boolean) as DnsRecord[];

	return merge(results);
}
