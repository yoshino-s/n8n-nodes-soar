import {
	IAuthenticate,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from "n8n-workflow";

export class FofaCredentials implements ICredentialType {
	name = "fofaCredentialsApi";
	displayName = "Fofa Credentials";
	documentationUrl = "https://fofa.info/api";
	icon = "file:fofa.svg";
	properties: INodeProperties[] = [
		{
			displayName: "Fofa Email",
			name: "email",
			type: "string",
			placeholder: "name@email.com",
			default: "",
		},
		{
			displayName: "Fofa Key",
			name: "key",
			type: "string",
			default: "",
		},
	];
	authenticate: IAuthenticate = {
		type: "generic",
		properties: {
			qs: {
				email: "={{$credentials.email}}",
				key: "={{$credentials.key}}",
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			url: "https://fofa.info/api/v1/info/my",
			qs: {
				email: "={{$credentials.email}}",
				key: "={{$credentials.key}}",
			},
		},
	};
}
