export type BotStatus =
  | "not_deployed"
  | "provisioning"
  | "deploying"
  | "live"
  | "failed"
  | "deleting"
  | "deleted";

export type DeployBotAction =
  | "created_and_deploying"
  | "redeploying"
  | "already_live"
  | "already_in_progress";

export interface BotStatusResponse {
  status: BotStatus;
  serviceId: string | null;
  deploymentId: string | null;
  successUrl: string | null;
  lastError: string | null;
  updatedAt: string;
  subscriptionActive: boolean;
}

export interface DeployBotResponse extends BotStatusResponse {
  action: DeployBotAction;
}

export const TERMINAL_BOT_STATUSES = new Set<BotStatus>([
  "not_deployed",
  "live",
  "failed",
  "deleted",
]);
