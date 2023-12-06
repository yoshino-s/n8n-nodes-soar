import AsyncLock from "async-lock";
import {
	IAllExecuteFunctions,
	IHttpRequestOptions,
	NodeApiError,
} from "n8n-workflow";
import NodeCache from "node-cache";

const cache = new NodeCache({
	stdTTL: 60 * 24,
});

const lock = new AsyncLock();
let lastRequestTime = Date.now();
const REQUEST_INTERVAL = 2000;

export enum RESOURCES {
	TASK = "bugs/tasks",
	VULNERABILITY = "vulnerability",
	BUSINESS = "bugs/business",
	VPN = "project/vpn",
}

const questionAnswer: Record<number, number | number[]> = {
	1: 1,
	2: 1,
	3: 1,
	4: [0, 1],
	5: 1,
	6: 1,
	7: 3,
	8: 1,
	9: [0, 1],
	10: 1,
	11: 4,
	12: 0,
	13: 1,
	14: 1,
	15: 1,
	16: 1,
	18: 1,
	19: 0,
	20: 4,
	21: [0, 2],
	22: [0, 1, 2, 3],
	23: 0,
};

interface IndustryItem {
	id: number;
	title: string;
	pid: number;
	children?: Omit<IndustryItem, "children">[];
}

interface AreaItem {
	id: number;
	name: string;
	pid: number;
	children: Omit<AreaItem, "children">[];
}

export interface BugTypeItem {
	id: number;
	title: string;
	order: number;
	parent_id: number;
	view: string;
	children?: BugTypeItem[];
	is_show?: number;
	level?: number;
}

interface ExtendedHttpRequestOptions extends IHttpRequestOptions {
	cache?: boolean;
}

interface ListOptions {
	page?: number;
	per_page?: number;
	search_value?: string;
	[key: string]: any;
}

type ListResponse<
	Resource extends RESOURCES,
	Full extends boolean,
	Data = Resource extends RESOURCES.TASK
		? TaskItem
		: Resource extends RESOURCES.BUSINESS
		  ? BusinessItem
		  : any,
> = Full extends true ? ListFullResponse<Data> : Data[];

interface ListFullResponse<T> {
	current_page: number;
	data: T[];
	last_page: number;
	per_page: number;
	total: number;
}

interface TaskItem {
	task_title: string;
	id: number;
	project_type: number;
	task_type_id: number;
	task_type_name: string;
	task_report_status: number;
	task_report_status_name: string;
}

interface BusinessItem {
	bus_name: string;
	bus_url: string;
	bus_type: number;
}

interface Response<T> {
	code: number;
	msg: string;
	data: T;
}

class NeedQuestionError extends Error {}
class VulboxApiError extends NodeApiError {}

export interface SubmitBugRequest {
	/**
	 * 项目ID
	 */
	task_id: number;
	/**
	 * 漏洞标题
	 */
	bug_title: string;
	/**
	 * 同意协议
	 */
	protocol: true;
	/**
	 * 地区
	 */
	area: string[];
	/**
	 * 行业
	 */
	industry: string;
	/**
	 * 行业类别
	 */
	industry_category: string[];
	/**
	 * 是否匿名
	 */
	bug_display: boolean;
	/**
	 * 漏洞类别
	 * @enum 1: 事件型漏洞
	 * @enum 2: 通用型漏洞
	 */
	bug_category: 1 | 2;
	/**
	 * 参与评定
	 * @enum 0: 普通漏洞
	 * @enum 1: 星选漏洞
	 */
	bug_star: 0 | 1;
	/**
	 * 厂商名称
	 */
	bug_firm_name: string;
	/**
	 * 厂商域名
	 */
	domain: string;
	/**
	 * 漏洞类型
	 */
	bug_type: number[];
	/**
	 * 漏洞等级
	 */
	bug_level: number;
	/**
	 * 漏洞简述
	 */
	bug_paper: string;
	/**
	 * 复现步骤
	 */
	repetition_step: string;
	/**
	 * 修复建议
	 */
	fix_plan: string;
	/**
	 * 漏洞URL
	 */
	bug_url?: string;
	bug_parameter?: string;
	bug_poc?: string;
	bug_version?: string;
	bug_platform?: string;
	bug_equipment?: string;
	bug_star_desc?: string;
}

export class VulboxApi {
	constructor(private readonly func: IAllExecuteFunctions) {}

	async request<T = any>(options: ExtendedHttpRequestOptions): Promise<T> {
		while (true) {
			const resp = await lock.acquire<Response<T>>(
				"vulboxApi",
				async () => {
					if (options.cache) {
						const cacheKey = JSON.stringify(options);
						const cached = cache.get(cacheKey);
						if (cached) {
							return cached as T;
						}
					}

					if (Date.now() - lastRequestTime < REQUEST_INTERVAL) {
						await new Promise((resolve) =>
							setTimeout(resolve, REQUEST_INTERVAL),
						);
					}

					this.func.logger.info(`Requesting ${options.url}`);
					lastRequestTime = Date.now();
					const resp: Response<T> =
						await this.func.helpers.httpRequestWithAuthentication.call(
							this.func,
							"vulboxApi",
							options,
						);

					this.func.logger.info(`Response ${JSON.stringify(resp)}`);

					if (resp.code !== 200) {
						if (resp.code === 429) {
						} else if (resp.code === 550) {
							throw new NeedQuestionError();
						} else {
							throw new VulboxApiError(
								this.func.getNode(),
								resp as any,
								{
									message: `Vulbox API error response: ${JSON.stringify(
										resp,
									)}`,
								},
							);
						}
					}

					if (options.cache) {
						const cacheKey = JSON.stringify(options);
						cache.set(cacheKey, resp);
					}

					return resp;
				},
			);

			if (resp.code === 429) {
				continue;
			}

			return resp.data;
		}
	}

	async listIndustries(): Promise<IndustryItem[]> {
		return this.request({
			method: "GET",
			url: "https://user.vulbox.com/api/hacker/common/industry",
			cache: true,
		});
	}

	async listAreas(): Promise<AreaItem[]> {
		return this.request({
			method: "GET",
			url: "https://user.vulbox.com/api/hacker/common/area",
			cache: true,
		});
	}

	async listBugTypes(): Promise<BugTypeItem[]> {
		return this.request({
			method: "GET",
			url: "https://user.vulbox.com/api/hacker/bugs/bug_type/list",
			cache: true,
		});
	}

	async list<Resource extends RESOURCES, Full extends boolean>(
		resource: Resource,
		full: Full,
		options?: ListOptions,
	): Promise<ListResponse<Resource, Full>> {
		const resp = await this.request({
			method: "GET",
			url: `https://user.vulbox.com/api/hacker/${resource}${
				resource === RESOURCES.BUSINESS ? "" : "/list"
			}`,
			qs: options,
		});
		if (full) {
			return resp;
		} else {
			return resp.data;
		}
	}

	async submitBug(request: SubmitBugRequest): Promise<Response<any>> {
		try {
			const resp = await this.request({
				method: "POST",
				url: "https://user.vulbox.com/api/hacker/bugs/bugs",
				body: request,
			});
			return {
				code: 200,
				msg: "success",
				data: resp,
			};
		} catch (e) {
			if (e instanceof NeedQuestionError) {
				await this.solveQuestion();
				return await this.submitBug(request);
			} else if (e instanceof VulboxApiError) {
				return e.cause as any;
			} else {
				throw e;
			}
		}
	}

	async solveQuestion() {
		const questions = (await this.request({
			method: "GET",
			url: "https://user.vulbox.com/api/hacker/question",
		})) as { id: number }[];
		const answers = questions.reduce<Record<number, number | number[]>>(
			(acc, cur) => {
				acc[cur.id] = questionAnswer[cur.id];
				return acc;
			},
			{},
		);
		await this.request({
			method: "POST",
			url: "https://user.vulbox.com/api/hacker/question",
			body: { question_ids: answers },
		});
	}
}
