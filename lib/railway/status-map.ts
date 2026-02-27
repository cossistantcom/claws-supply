import type { BotStatus } from "@/lib/bot/types";
import type { RailwayDeploymentStatus } from "./types";

export function mapRailwayStatusToBotStatus(
  status: RailwayDeploymentStatus | null | undefined,
): BotStatus {
  if (!status) {
    return "deploying";
  }

  switch (status) {
    case "BUILDING":
    case "WAITING":
    case "QUEUED":
      return "provisioning";
    case "DEPLOYING":
      return "deploying";
    case "SUCCESS":
      return "live";
    case "FAILED":
    case "CRASHED":
    case "REMOVED":
      return "failed";
    case "SLEEPING":
    case "SKIPPED":
      return "live";
    default:
      return "deploying";
  }
}
