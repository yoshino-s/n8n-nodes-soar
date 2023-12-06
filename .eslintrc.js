/**
 * @type {import('@types/eslint').ESLint.ConfigData}
 */
module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	ignorePatterns: ["node_modules/", "dist/"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint/eslint-plugin"],
	extends: [
		"plugin:@typescript-eslint/recommended",
		"prettier",
		"plugin:prettier/recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
	],
	rules: {
		"prettier/prettier": ["error", { singleQuote: false }],
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-unused-vars": [
			"error",
			{ ignoreRestSiblings: true, argsIgnorePattern: "^_" },
		],
		semi: ["error", "always"],
		quotes: [2, "double", "avoid-escape"],
		"eol-last": ["error", "always"],
		"import/order": [
			"error",
			{
				"newlines-between": "always",
				alphabetize: {
					order: "asc",
				},
			},
		],
		"import/no-unresolved": "off",
	},
	settings: {
		"import/resolver": {
			typescript: {},
		},
	},
	overrides: [
		{
			files: ["package.json"],
			plugins: ["eslint-plugin-n8n-nodes-base"],
			extends: ["plugin:n8n-nodes-base/community"],
		},
		{
			files: ["./src/**/*.ts"],
			plugins: ["eslint-plugin-n8n-nodes-base"],
			extends: ["plugin:n8n-nodes-base/nodes"],
			rules: {
				"n8n-nodes-base/node-param-multi-options-type-unsorted-items":
					"off",
				"n8n-nodes-base/node-param-options-type-unsorted-items": "off",
			},
		},
	],
};
