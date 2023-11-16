import { ICredentialType, INodeProperties } from "n8n-workflow";

export class Kubernetes implements ICredentialType {
	name = "kubernetesApi";
	displayName = "Kubernetes Credentials";
	documentationUrl = "https://github.com/kubernetes-client/javascript";
	icon = "file:k8s.svg";
	properties: INodeProperties[] = [
		{
			displayName: "Load From",
			name: "loadFrom",
			type: "options",
			options: [
				{
					name: "Automatic",
					value: "automatic",
				},
				{
					name: "File",
					value: "file",
				},
				{
					name: "Content",
					value: "content",
				},
			],
			default: "automatic",
		},
		{
			displayName: "File Path",
			name: "filePath",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					loadFrom: ["file"],
				},
			},
		},
		{
			displayName: "Content",
			name: "content",
			type: "string",
			default: "",
			typeOptions: {
				rows: 4,
			},
			displayOptions: {
				show: {
					loadFrom: ["content"],
				},
			},
		},
	];
}
