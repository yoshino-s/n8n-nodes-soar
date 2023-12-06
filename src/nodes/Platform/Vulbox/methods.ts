import {
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodePropertyOptions,
	INodeType,
} from "n8n-workflow";

import { RESOURCES, VulboxApi } from "./api";

export const methods = {
	listSearch: {
		async listBusinesses(
			this: ILoadOptionsFunctions,
			filter?: string,
			paginationToken?: string,
		): Promise<INodeListSearchResult> {
			const client = new VulboxApi(this);
			const page = paginationToken ? parseInt(paginationToken) : 1;
			const resp = await client.list(RESOURCES.BUSINESS, true, {
				search_value: filter ?? "",
				page: page,
			});
			return {
				results: resp.data.map((n) => ({
					name: `${n.bus_name}|${n.bus_url}`,
					url: n.bus_url,
					value: JSON.stringify(n),
				})),
				paginationToken: page === resp.last_page ? undefined : page + 1,
			};
		},

		async listTasks(
			this: ILoadOptionsFunctions,
			filter?: string,
			paginationToken?: string,
		): Promise<INodeListSearchResult> {
			const client = new VulboxApi(this);
			const page = paginationToken ? parseInt(paginationToken) : 1;
			const resp = await client.list(RESOURCES.TASK, true, {
				search_value: filter ?? "",
				page: page,
			});
			return {
				results: resp.data.map((n) => ({
					name: n.task_title,
					value: n.id,
				})),
				paginationToken: page === resp.last_page ? undefined : page + 1,
			};
		},
	},

	loadOptions: {
		async listAreas(
			this: ILoadOptionsFunctions,
		): Promise<INodePropertyOptions[]> {
			const client = new VulboxApi(this);
			const resp = await client.listAreas();

			return resp
				.flatMap(({ name: parentName, children }) =>
					children.map(({ name }) => [parentName, name]),
				)
				.map((v) => ({
					name: v.join("/"),
					value: v.join("/"),
				}));
		},

		async listIndustries(
			this: ILoadOptionsFunctions,
		): Promise<INodePropertyOptions[]> {
			const client = new VulboxApi(this);
			const resp = await client.listIndustries();

			return resp
				.map(({ title }) => title)
				.map((v) => ({
					name: v,
					value: v,
				}));
		},

		async listIndustryCategories(
			this: ILoadOptionsFunctions,
		): Promise<INodePropertyOptions[]> {
			const client = new VulboxApi(this);
			const resp = await client.listIndustries();
			const industry = this.getNodeParameter("industry") as string;

			return (
				resp
					.find(({ title }) => title === industry)
					?.children?.map(({ title }) => ({
						name: title,
						value: title,
					})) ?? []
			);
		},

		async listTopLevelBugTypes(
			this: ILoadOptionsFunctions,
		): Promise<INodePropertyOptions[]> {
			const client = new VulboxApi(this);
			const resp = await client.listBugTypes();

			return resp.map((v) => ({
				name: v.title,
				value: v.title,
			}));
		},

		async listBugTypes(
			this: ILoadOptionsFunctions,
		): Promise<INodePropertyOptions[]> {
			const client = new VulboxApi(this);
			const resp = await client.listBugTypes();
			const flatBugTypes: INodePropertyOptions[] = [];
			const topLevelBugType = this.getNodeParameter(
				"bug_type_top",
			) as string;
			const topLevelBugTypeObj = resp.find(
				({ title }) => title === topLevelBugType,
			);
			if (!topLevelBugTypeObj) {
				return [];
			}

			function flatten(
				bugTypes: typeof resp = [],
				prefix: string[] = [],
				path: number[] = [],
			): void {
				for (const { id, title, children } of bugTypes) {
					if (!children) {
						flatBugTypes.push({
							name: [...prefix, title].join("/"),
							value: JSON.stringify(
								[...path, id].map((v) => v.toString()),
							),
						});
					} else {
						flatten(children, [...prefix, title], [...path, id]);
					}
				}
			}

			flatten(
				topLevelBugTypeObj.children ?? [],
				[topLevelBugTypeObj.title],
				[topLevelBugTypeObj.id],
			);

			return flatBugTypes;
		},
	},
} satisfies INodeType["methods"];
