import * as fs from "fs";

import chalk from "chalk";
import { glob } from "glob";

const files = glob.sync("src/{credentials,nodes}/**/*.{png,jpg,svg,json}");
files.forEach((file) => {
	const destination = file.replace("src/", "dist/");
	console.log(`${chalk.green("✔")} ${file} -> ${destination}`);
	fs.copyFileSync(file, destination);
});
