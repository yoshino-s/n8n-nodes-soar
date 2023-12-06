import { instanceToPlain, plainToInstance } from "class-transformer";
import "reflect-metadata";

export class Basic {
	ip?: string;
	domain?: string;
	port?: number;
	protocol?: "tcp" | "udp";
}

export type DnsRecord = Record<string, string[]>;

export type Ports = { port: number; protocol: "tcp" | "udp" }[];

export class MissingPropertyError extends Error {
	constructor(property: string, asset: Asset) {
		super(
			`Missing property: ${property} on ${JSON.stringify(
				instanceToPlain(asset),
			)}`,
		);
	}
}

export class Asset {
	basic = new Basic();
	metadata?: Record<string, any>;

	response?: any;
	screenshot?: string;

	static fromPlain(plain: Partial<Asset>): Asset {
		return plainToInstance(Asset, plain);
	}

	getDomain(): string {
		if (!this.basic.domain) {
			throw new MissingPropertyError("basic.domain", this);
		}
		return this.basic.domain;
	}

	getHost(): string {
		if (!(this.basic.domain || this.basic.ip)) {
			throw new MissingPropertyError("basic.host", this);
		}
		return this.basic.domain || this.basic.ip || "";
	}

	getIP(): string {
		if (!this.basic.ip) {
			throw new MissingPropertyError("basic.ip", this);
		}
		return this.basic.ip;
	}

	getPort(): number {
		if (!this.basic.port) {
			throw new MissingPropertyError("basic.port", this);
		}
		return this.basic.port;
	}

	getHostAndPort(): string {
		return `${this.getHost()}:${this.getPort()}`;
	}

	clone(patch?: Partial<Asset>): Asset {
		return Asset.fromPlain(Object.assign({}, this, patch));
	}

	splitBySubdomains(subdomains: string[]): Asset[] {
		return [
			this,
			...subdomains.map((n) => {
				return Asset.fromPlain({
					basic: {
						domain: n,
					},
					metadata: this.metadata,
				});
			}),
		];
	}

	splitByDnsRecords(dnsRecord: DnsRecord): Asset[] {
		return [...(dnsRecord?.A ?? []), ...(dnsRecord?.AAAA ?? [])].map(
			(n) => {
				return Asset.fromPlain({
					basic: {
						domain: this.basic.domain,
						ip: n,
					},
					metadata: this.metadata,
				});
			},
		);
	}

	splitByPorts(ports: Ports): Asset[] {
		return ports.map((n) => {
			return Asset.fromPlain({
				basic: {
					domain: this.basic.domain,
					ip: this.basic.ip,
					port: n.port,
					protocol: n.protocol,
				},
				metadata: this.metadata,
			});
		});
	}

	toPlain() {
		return instanceToPlain(this);
	}
}
