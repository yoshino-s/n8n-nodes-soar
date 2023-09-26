import { ParseResult } from "./parser";
import { parseProjectDiscovery } from "./projectdiscovery";

export async function parseOptions(content: string): Promise<ParseResult> {
	return await parseProjectDiscovery(content);
}
