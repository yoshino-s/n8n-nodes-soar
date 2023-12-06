import { set } from "lodash";
import { INodeProperties } from "n8n-workflow";

export const listProperties: INodeProperties[] = (
	[
		{
			displayName: "Vulnerability Type",
			name: "vulType",
			type: "options",
			noDataExpression: true,
			default: 0,
			displayOptions: {
				show: {
					resource: ["vulnerability"],
				},
			},
			options: [
				{
					name: "Ordinary",
					value: 0,
				},
				{
					name: "Enterprise",
					value: 9,
				},
				{
					name: "Private",
					value: 3,
				},
			],
		},
		{
			displayName: "Page",
			name: "page",
			type: "number",
			default: 1,
		},
		{
			displayName: "Size",
			name: "per_page",
			type: "number",
			default: 100,
		},
		{
			displayName: "Search",
			name: "search_value",
			type: "string",
			default: "",
		},
		{
			displayName: "Return Full Response",
			name: "full",
			type: "boolean",
			default: false,
		},
	] satisfies INodeProperties[]
).map((p) => {
	set(p, "displayOptions.show.operation", ["list"]);
	return p;
});

export const submitProperties: INodeProperties[] = (
	[
		{
			displayName: "项目 Task",
			name: "task",
			type: "resourceLocator",
			default: { mode: "list", value: 0 },
			required: true,
			modes: [
				{
					displayName: "From List",
					name: "list",
					type: "list",
					placeholder: "Select a task",
					typeOptions: {
						searchListMethod: "listTasks",
						searchable: true,
					},
				},
			],
		},
		{
			displayName: "漏洞标题 Bug Title",
			name: "bug_title",
			type: "string",
			default: "",
			required: true,
		},
		{
			displayName: "漏洞类别 Bug Category",
			name: "bug_category",
			type: "options",
			default: 1,
			required: true,
			options: [
				{
					name: "事件型漏洞",
					value: 1,
				},
				{
					name: "通用型漏洞",
					value: 2,
				},
			],
		},
		{
			displayName: "参与评定 Vulnerability Star",
			name: "bug_star",
			type: "options",
			default: 0,
			required: true,
			options: [
				{
					name: "普通漏洞",
					value: 0,
				},
				{
					name: "星选漏洞",
					value: 1,
				},
			],
		},
		{
			displayName: "厂商名称 Business Name",
			name: "business",
			type: "resourceLocator",
			default: { mode: "list", value: "" },
			required: true,
			modes: [
				{
					displayName: "From List",
					name: "list",
					type: "list",
					placeholder: "Select a business",
					typeOptions: {
						searchListMethod: "listBusinesses",
						searchable: true,
					},
				},
				{
					displayName: "Others",
					name: "id",
					type: "string",
				},
			],
			displayOptions: {
				show: {
					operation: ["submit"],
				},
			},
		},
		{
			displayName: "厂商域名 Domain",
			name: "domain",
			type: "string",
			default: "={{ JSON.parse($parameter.business).bus_url }}",
			placeholder: "https://www.example.com",
		},
		{
			displayName: "一级漏洞类型 Top Level Bug Type Name or ID",
			name: "bug_type_top",
			type: "options",
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			default: "",
			required: true,
			typeOptions: {
				loadOptionsMethod: "listTopLevelBugTypes",
			},
		},
		{
			displayName: "二级漏洞类型 Bug Type Name or ID",
			name: "bug_type",
			type: "options",
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			default: "",
			required: true,
			typeOptions: {
				loadOptionsMethod: "listBugTypes",
			},
			displayOptions: {
				hide: {
					bug_type_top: ["智能硬件", "其他", "其它"],
				},
			},
		},
		{
			displayName: "漏洞等级 Bug Level",
			name: "bug_level",
			type: "options",
			default: 1,
			required: true,
			options: [
				{
					name: "低危",
					value: 1,
				},
				{
					name: "中危",
					value: 2,
				},
				{
					name: "高危",
					value: 3,
				},
				{
					name: "严重",
					value: 4,
				},
			],
		},
		{
			displayName: "漏洞简述 Bug Paper",
			name: "bug_paper",
			type: "string",
			default: "",
			typeOptions: {
				rows: 8,
			},
		},
		{
			displayName: "厂商截图 Bug Star Description",
			name: "bug_star_desc",
			type: "string",
			default: "",
			typeOptions: {
				editor: "htmlEditor",
				rows: 8,
			},
			displayOptions: {
				show: {
					bug_star: [1],
				},
			},
		},
		{
			displayName: "漏洞URL Bug URL",
			name: "bug_url",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					bug_type_top: ["Web漏洞"],
				},
			},
		},
		{
			displayName: "漏洞参数 Bug Parameter",
			name: "bug_parameter",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					bug_type_top: ["Web漏洞"],
				},
			},
		},

		{
			displayName: "设备 Bug Equipment",
			name: "bug_equipment",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					bug_type_top: ["移动客户端漏洞"],
				},
			},
		},
		{
			displayName: "平台 Bug Platform",
			name: "bug_platform",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					bug_type_top: ["移动客户端漏洞"],
				},
			},
		},
		{
			displayName: "版本 Bug Version",
			name: "bug_version",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					bug_type_top: ["移动客户端漏洞"],
				},
			},
		},
		{
			displayName: "漏洞POC Bug POC",
			name: "bug_poc",
			type: "string",
			default: "",
		},
		{
			displayName: "复现步骤 Repetition Step",
			name: "repetition_step",
			type: "string",
			default: "",
			typeOptions: {
				editor: "htmlEditor",
				rows: 8,
			},
			required: true,
		},
		{
			displayName: "修复建议 Fix Plan",
			name: "fix_plan",
			type: "string",
			default: "",
			typeOptions: {
				editor: "htmlEditor",
				rows: 8,
			},
			required: true,
		},
		{
			displayName: "地区 Area Name or ID",
			name: "area",
			type: "options",
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			default: "",
			required: true,
			typeOptions: {
				loadOptionsMethod: "listAreas",
			},
		},
		{
			displayName: "行业 Industry Name or ID",
			name: "industry",
			type: "options",
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			default: "",
			required: true,
			typeOptions: {
				loadOptionsMethod: "listIndustries",
			},
		},
		{
			displayName: "Industry Category Name or ID",
			name: "industry_category",
			type: "options",
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
			default: "",
			required: true,
			typeOptions: {
				loadOptionsMethod: "listIndustryCategories",
			},
		},
		{
			displayName: "是否匿名 Bug Anonymous",
			name: "bug_display",
			type: "boolean",
			default: false,
		},
	] satisfies INodeProperties[]
).map((p) => {
	set(p, "displayOptions.show.operation", ["submit"]);
	return p;
});
