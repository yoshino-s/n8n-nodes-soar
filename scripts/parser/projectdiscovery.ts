import inquirer from "inquirer";
import {
	INodeProperties,
	INodePropertyCollection,
	INodePropertyOptions,
} from "n8n-workflow";

import { toCamelCase, toDisplayName } from "../utils";

import { ParseResult } from "./parser";

export async function parseProjectDiscovery(
	content: string
): Promise<ParseResult> {
	const result: ParseResult = {
		properties: [
			{
				displayName: "Options",
				name: "options",
				type: "fixedCollection",
				default: {},
				typeOptions: {
					multipleValues: true,
				},
				options: [],
			},
		] satisfies INodeProperties[],
		targetArg: "",
		extraArgs: [],
		extraArgParameters: [],
		format: "line",
	};

	try {
		const flags = content.split("Flags:")[1].split("\n");
		let options: INodePropertyCollection;

		const lineRe =
			/^(?<args>(?:[, ]*-[\w\-]+)+)\s*(?<type>(?:string|int|value|string\[\]))?\s+(?<description>.*)$/i;

		flags.push("END");
		for (let line of flags) {
			line = line.trim();
			if (!line) {
				continue;
			}
			if (line.startsWith("-")) {
				const res = lineRe.exec(line);
				if (!res) {
					throw new Error(`Invalid line: ${line}`);
				}
				let { args, description, type } = res.groups;
				type = type?.trim();
				args = args
					.split(", ")
					.reduce((p, c) => (p.length > c.length ? p : c), "");

				if (
					(options?.name === "output" && args === "-json") ||
					args === "-jsonl"
				) {
					if (
						args.includes("jsonl") ||
						description.toLocaleLowerCase().includes("jsonl") ||
						description.toLocaleLowerCase().includes("line")
					) {
						result.format = "jsonl";
						result.extraArgs.push(args);
					} else {
						result.format = "json";
						result.extraArgs.push(args);
					}
				}

				if (["-silent", "-disable-update-check"].includes(args)) {
					result.extraArgs.push(args);
				}

				if (
					options.name === "output" &&
					[
						"-output",
						"-store",
						"-json",
						"-silent",
						"-no-color",
						"-verbose",
						"-debug",
						"-version",
						"-csv",
					].some((v) => args.startsWith(v))
				) {
					continue;
				}

				if (type) {
					description = `${description} (${type})`;
					if (options.values.length === 1) {
						options.values.push({
							displayName: "Value",
							name: "value",
							type: "string",
							default: "",
						});
					}
				}
				description = description.trim();

				(options.values[0].options as INodePropertyOptions[]).push({
					name: toDisplayName(args),
					value: args,
					description,
				});
			} else {
				line = line.slice(0, -1);

				if (["input", "target"].includes(options?.name)) {
					await inquirer
						.prompt([
							{
								type: "list",
								name: "input",
								message: "Choose the input options",
								choices: options.values[0].options.map(
									({ name, value, description }: any) => ({
										name: `${name} - ${description}`,
										value,
									})
								),
							},
							{
								type: "checkbox",
								name: "keey",
								message: "Keep the input options?",
								choices: options.values[0].options.map(
									({ name, value, description }: any) => ({
										name: `${name} - ${description}`,
										value,
									})
								),
							},
						])
						.then((answers) => {
							result.targetArg = answers.input;
							options.values[0].options =
								options.values[0].options.filter(
									({ value }: any) =>
										answers.keey.includes(value)
								);
						});
				}

				if (
					options &&
					options.values[0].options?.length &&
					!["debug", "update"].includes(options.name)
				) {
					result.extraArgParameters.push(`options.${options.name}`);
					result.properties[0].options.push(options);
				}

				options = {
					displayName: toDisplayName(line),
					name: toCamelCase(line),
					values: [
						{
							displayName: "Options",
							name: "key",
							type: "options",
							default: "",
							options: [],
						},
					],
				};
			}
		}
	} catch (error) {
		console.log(error);
	}
	return result;
}
