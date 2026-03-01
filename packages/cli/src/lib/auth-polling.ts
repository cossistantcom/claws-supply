import { ApiHttpError } from "./api";

export type PollDecision =
  | { action: "continue"; delayMs?: number }
  | { action: "slow_down"; delayMs?: number }
  | { action: "fail"; reason: string };

function normalizeMessage(message: string): string {
  return message.trim().toLowerCase();
}

export function classifyAuthPollError(error: unknown): PollDecision {
  if (error instanceof ApiHttpError) {
    if (error.status === 429) {
      return {
        action: "slow_down",
        delayMs: error.retryAfterSeconds ? error.retryAfterSeconds * 1000 : undefined,
      };
    }

    const message = normalizeMessage(error.message);

    if (message.includes("authorization pending") || message.includes("pending")) {
      return { action: "continue" };
    }

    if (
      message.includes("slow down") ||
      message.includes("polling too frequently") ||
      message.includes("too frequently")
    ) {
      return { action: "slow_down" };
    }

    if (
      message.includes("access denied") ||
      message.includes("denied") ||
      message.includes("expired") ||
      message.includes("invalid grant") ||
      message.includes("invalid device") ||
      message.includes("client id mismatch")
    ) {
      return { action: "fail", reason: error.message };
    }

    if (error.status >= 500) {
      return { action: "continue" };
    }

    return { action: "fail", reason: error.message };
  }

  if (error instanceof Error) {
    const message = normalizeMessage(error.message);
    if (message.includes("network") || message.includes("timed out")) {
      return { action: "continue" };
    }

    return { action: "fail", reason: error.message };
  }

  return { action: "fail", reason: "Unknown polling error." };
}
