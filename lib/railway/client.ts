import type { RailwayConfig } from "@/lib/config";
import type { RailwayGraphQLResponse } from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown Railway API error.";
}

export class RailwayApiError extends Error {
  status: number | null;
  details: string | null;

  constructor(message: string, options?: { status?: number; details?: string }) {
    super(message);
    this.name = "RailwayApiError";
    this.status = options?.status ?? null;
    this.details = options?.details ?? null;
  }
}

export async function callRailwayGraphQL<TData, TVariables extends object>(
  config: RailwayConfig,
  query: string,
  variables: TVariables,
): Promise<TData> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new RailwayApiError("Railway request failed.", {
        status: response.status,
        details: body.slice(0, 500),
      });
    }

    const payload = (await response.json()) as RailwayGraphQLResponse<TData>;
    if (payload.errors && payload.errors.length > 0) {
      const details = payload.errors
        .map((error) => error.message?.trim())
        .filter((message): message is string => Boolean(message))
        .join("; ");

      throw new RailwayApiError("Railway GraphQL returned errors.", {
        details: details || undefined,
      });
    }

    if (!payload.data) {
      throw new RailwayApiError("Railway GraphQL returned no data.");
    }

    return payload.data;
  } catch (error) {
    if (error instanceof RailwayApiError) {
      throw error;
    }

    throw new RailwayApiError("Unable to call Railway GraphQL API.", {
      details: getErrorMessage(error),
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
