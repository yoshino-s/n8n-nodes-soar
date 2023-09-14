import { execSync } from "child_process";
import * as fs from "fs";

import chalk from "chalk";

import pkg from "../package.json";

import { parseProjectDiscovery } from "./parse";
import { toCamelCase } from "./utils";

function success(s: string) {
	console.log(`${chalk.green("✔")} ${s}`);
}
function error(s: string) {
	console.log(`${chalk.red("❌")} ${s}`);
}

function eslint(file: string) {
	for (let i = 0; i < 3; i++) {
		try {
			execSync(`yarn -s eslint ${file} --fix`, { stdio: "ignore" });
			break;
		} catch (e) {
			error("eslint failed");
		}
	}
	execSync(`yarn -s eslint ${file} --fix`, { stdio: "inherit" });
	success("eslint passed");
}

async function main() {
	const nodeInfo = {
		node: "n8n-nodes-soar.kubernetes",
		nodeVersion: "1.0",
		codexVersion: "1.0",
		categories: ["Development", "Container"],
	};

	const n = process.argv[2];
	if (!n) {
		error("Missing name argument");
		process.exit(1);
	}

	nodeInfo.node = `n8n-nodes-soar.${toCamelCase(n)}`;
	const dst = `dist/nodes/${toCamelCase(n, true)}/${toCamelCase(
		n,
		true
	)}.node.js`;

	if (pkg.n8n.nodes.includes(dst)) {
		error(`${dst} already exists`);
	} else {
		pkg.n8n.nodes.push(dst);
	}

	const nodeDir = `./src/nodes/${toCamelCase(n, true)}`;
	const nodeFile = `${nodeDir}/${toCamelCase(n, true)}.node.ts`;
	const nodeInfoPath = `${nodeDir}/${toCamelCase(n, true)}.node.json`;

	const content = execSync(
		`docker run --pull always --rm registry.yoshino-s.xyz/yoshino-s/soar-image:dev ${n} --help`,
		{ stdio: "pipe" }
	).toString();

	const { properties, targetArg, extraArgs, format, extraArgParameters } =
		await parseProjectDiscovery(content);

	const formatMap = {
		json: "JSON.parse",
		jsonl: "d => d.split('\\n').map(n=>n.trim()).filter(Boolean).map(d => JSON.parse(d))",
		line: "d => d.split('\\n').map(n=>n.trim()).filter(Boolean)",
	};

	fs.mkdirSync(nodeDir, { recursive: true });
	success(`${nodeDir} created`);
	fs.writeFileSync(
		nodeFile,
		fs
			.readFileSync("./scripts/template.txt", "utf-8")
			.replace(/Template/g, toCamelCase(n, true))
			.replace(/template/g, `${toCamelCase(n, false)}`)
			.replace("PROPERTY", JSON.stringify(properties, null, 2))
			.replace("HAS_TARGET_ARG", targetArg ? "true" : "false")
			.replace("TARGET_ARG", JSON.stringify(targetArg, null, 2))
			.replace("EXTRA_ARGS", JSON.stringify(extraArgs, null, 2))
			.replace(
				"EXTRA_ARG_PARAMETERS",
				JSON.stringify(extraArgParameters, null, 2)
			)

			.replace("FORMAT_MAP", formatMap[format])
	);
	success(`${nodeFile} created`);
	fs.writeFileSync(nodeInfoPath, JSON.stringify(nodeInfo, null, 2));
	success(`${nodeInfoPath} created`);
	fs.writeFileSync("./package.json", JSON.stringify(pkg, null, 2));
	success("package.json updated");

	eslint(nodeFile);
}

main();
