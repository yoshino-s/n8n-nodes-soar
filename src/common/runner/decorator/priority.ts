import { declareClassDecorator } from "@/utils/decorator";

export type PriorityLevel = number;

export const DEFAULT_PRIORITY = 0;
export const DOMAIN_RUNNER_PRIORITY = 100;
export const DNS_RUNNER_PRIORITY = 90;
export const IP_RUNNER_PRIORITY = 80;
export const PORT_RUNNER_PRIORITY = 70;
export const BANNER_RUNNER_PRIORITY = 60;
export const APP_RUNNER_PRIORITY = 50;
export const EXPLOIT_RUNNER_PRIORITY = 40;

export const [Priority, getPriority] = declareClassDecorator(
	"priority",
	DEFAULT_PRIORITY,
);
