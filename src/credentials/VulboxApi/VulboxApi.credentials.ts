import AsyncLock from "async-lock";
import { cloneDeep, set } from "lodash";
import {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from "n8n-workflow";

const vulboxLoginCache = new Map<string, string>();
const lock = new AsyncLock();

export class VulboxApi implements ICredentialType {
	name = "vulboxApi";
	displayName = "Vulbox API Credentials";
	documentationUrl = "https://www.vulbox.com";
	icon = "file:vulbox.svg";
	properties: INodeProperties[] = [
		{
			displayName: "Mode",
			name: "mode",
			type: "options",
			default: "email",
			options: [
				{
					name: "Email+Password",
					value: "email",
				},
				{
					name: "JWT",
					value: "jwt",
				},
			],
		},
		{
			displayName: "Vulbox Email/Username/Phone",
			name: "username",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					mode: ["email"],
				},
			},
		},
		{
			displayName: "Vulbox Password",
			name: "password",
			type: "string",
			typeOptions: { password: true },
			default: "",
			required: true,
			displayOptions: {
				show: {
					mode: ["email"],
				},
			},
		},
		{
			displayName: "Vulbox JWT",
			name: "jwt",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					mode: ["jwt"],
				},
			},
		},
	];

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		return await lock.acquire("vulboxLogin", async () => {
			function checkJwtExpired(jwt: string) {
				const jwtPayload = JSON.parse(atob(jwt.split(".")[1]));
				return jwtPayload.exp * 1000 < Date.now();
			}

			let jwtToken = "";

			if (credentials.mode === "jwt") {
				jwtToken = credentials.jwt as string;
			} else {
				const cachedToken = vulboxLoginCache.get(
					`${credentials.username} ${credentials.password}`,
				);
				if (cachedToken && !checkJwtExpired(cachedToken)) {
					jwtToken = cachedToken;
				} else {
					const result = await fetch(
						"https://vapi.vulbox.com/openapi/account/login/by",
						{
							method: "POST",
							headers: {
								uuid: Math.random().toString(36).slice(2),
								"Content-Type": "application/json",
								origin: "https://www.vulbox.com",
								referer: "https://www.vulbox.com",
							},
							body: JSON.stringify({
								login_by: "username",
								username: credentials.username.toString(),
								password: btoa(credentials.password.toString()),
							}),
						},
					).then((res) => res.json());
					if (result.code !== 200) {
						throw new Error(result.msg);
					}
					jwtToken = result.data.token;
					vulboxLoginCache.set(
						`${credentials.username} ${credentials.password}`,
						jwtToken,
					);
				}
			}

			const options = cloneDeep(requestOptions);
			set(options, "headers.Authorization", `Bearer ${jwtToken}`);

			return options;
		});
	}

	test: ICredentialTestRequest = {
		request: {
			method: "GET",
			url: "https://user.vulbox.com/api/hacker/user/account/info",
		},
		rules: [
			{
				type: "responseSuccessBody",
				properties: {
					key: "code",
					value: 401,
					message: "Invalid credentials!",
				},
			},
		],
	};
}
