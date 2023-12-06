import {
	IAuthenticate,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from "n8n-workflow";

export class SoarRunner implements ICredentialType {
	name = "soarRunnerApi";
	displayName = "Soar Runner";
	documentationUrl = "https://github.com/yoshino-s/n8n-nodes-soar";
	icon = "file:icon.svg";
	properties: INodeProperties[] = [
		{
			displayName: "URL",
			name: "url",
			type: "string",
			placeholder: "https://soar.example.com",
			default: "",
			required: true,
		},
		{
			displayName: "Username",
			name: "username",
			type: "string",
			default: "",
			required: true,
		},
		{
			displayName: "Password",
			name: "password",
			type: "string",
			typeOptions: { password: true },
			default: "",
			required: true,
		},
	];
	authenticate: IAuthenticate = {
		type: "generic",
		properties: {
			auth: {
				username: "={{$credentials.username}}",
				password: "={{$credentials.password}}",
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: "={{$credentials.url}}",
			url: "/metrics",
		},
	};
}
