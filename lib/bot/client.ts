import type { BotStatusResponse, DeployBotResponse } from "./types";

interface ApiErrorShape {
  error?: string;
}

async function requestJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const body = (await response.json()) as ApiErrorShape;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // noop: keep fallback message
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function fetchBotStatus(): Promise<BotStatusResponse> {
  return requestJson<BotStatusResponse>("/api/bot/status");
}

export function deployBotRequest(): Promise<DeployBotResponse> {
  return requestJson<DeployBotResponse>("/api/bot/deploy", {
    method: "POST",
  });
}
