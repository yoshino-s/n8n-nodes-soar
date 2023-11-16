import { ICredentialType, INodeProperties } from "n8n-workflow";

export class Docker implements ICredentialType {
	name = "dockerApi";
	displayName = "Docker Credentials";
	documentationUrl = "https://github.com/apocas/dockerode#getting-started";
	icon = "file:docker.svg";
	properties: INodeProperties[] = [
		{
			displayName: "Authentication Type",
			name: "authType",
			type: "options",
			options: [
				{
					name: "Socket",
					value: "socket",
				},
				{
					name: "Remote",
					value: "remote",
				},
			],
			default: "socket",
		},
		{
			displayName: "Socket Path",
			name: "socketPath",
			type: "string",
			default: "/var/run/docker.sock",
			displayOptions: {
				show: {
					authType: ["socket"],
				},
			},
		},
		{
			displayName: "Host",
			name: "host",
			type: "string",
			default: "localhost",
			displayOptions: {
				show: {
					authType: ["remote"],
				},
			},
		},
		{
			displayName: "Port",
			name: "port",
			type: "number",
			default: 2375,
			displayOptions: {
				show: {
					authType: ["remote"],
				},
			},
		},
		{
			displayName: "Use TLS",
			name: "useTls",
			type: "boolean",
			default: false,
			displayOptions: {
				show: {
					authType: ["remote"],
				},
			},
		},
		{
			displayName: "CA Certificate",
			name: "ca",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					authType: ["remote"],
					useTls: [true],
				},
			},
		},
		{
			displayName: "Certificate",
			name: "cert",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					authType: ["remote"],
					useTls: [true],
				},
			},
		},
		{
			displayName: "Key",
			name: "key",
			type: "string",
			default: "",
			displayOptions: {
				show: {
					authType: ["remote"],
					useTls: [true],
				},
			},
		},
	];
}
