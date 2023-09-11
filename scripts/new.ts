import * as fs from "fs";

import chalk from "chalk";

import pkg from "../package.json";

function toCamelCase(str: string, upperFirst = false) {
	const r = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
	if (upperFirst) {
		return r[0].toUpperCase() + r.slice(1);
	} else {
		return r[0].toLowerCase() + r.slice(1);
	}
}

const nodeInfo = {
	node: "n8n-nodes-soar.kubernetes",
	nodeVersion: "1.0",
	codexVersion: "1.0",
	categories: ["Development", "Container"],
};

const n = process.argv[2];
if (!n) {
	console.error(`${chalk.red("❌")} Missing name argument`);
	process.exit(1);
}

nodeInfo.node = `n8n-nodes-soar.${toCamelCase(n)}`;
const dst = `dist/nodes/${toCamelCase(n, true)}/${toCamelCase(
	n,
	true
)}.node.js`;
if (pkg.n8n.nodes.includes(dst)) {
	console.error(`${chalk.red("❌")} ${dst} already exists`);
	process.exit(1);
}
pkg.n8n.nodes.push(dst);

const nodeDir = `./src/nodes/${toCamelCase(n, true)}`;
const nodeFile = `${nodeDir}/${toCamelCase(n, true)}.node.ts`;
const nodeInfoPath = `${nodeDir}/${toCamelCase(n, true)}.node.json`;

fs.mkdirSync(nodeDir, { recursive: true });
console.log(`${chalk.green("✔")} ${nodeDir} created`);
fs.writeFileSync(
	nodeFile,
	fs
		.readFileSync("./src/nodes/Katana/Katana.node.ts", "utf-8")
		.replace(/Katana/g, toCamelCase(n, true))
		.replace(/"katana"/g, `"${toCamelCase(n, false)}"`)
);
console.log(`${chalk.green("✔")} ${nodeFile} created`);
fs.writeFileSync(nodeInfoPath, JSON.stringify(nodeInfo, null, 2));
console.log(`${chalk.green("✔")} ${nodeInfoPath} created`);
fs.writeFileSync("./package.json", JSON.stringify(pkg, null, 2));
console.log(`${chalk.green("✔")} package.json updated`);
