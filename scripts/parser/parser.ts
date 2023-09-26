import { INodeProperties } from "n8n-workflow";

export interface ParseResult {
	properties: INodeProperties[];
	targetArg: string;
	extraArgs: string[];
	extraArgParameters: string[];
	format: "json" | "jsonl" | "line";
}
