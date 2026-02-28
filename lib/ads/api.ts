import type { CreateAdCampaignInput } from "./schemas";
import type {
  AdAvailabilityDTO,
  AdCampaignDTO,
  CancelAdCampaignResponse,
  CreateAdCampaignResponse,
} from "./types";

type ApiSuccess<T> = {
  data: T;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let json: ApiSuccess<T> | ApiErrorPayload | null = null;
  try {
    json = (await response.json()) as ApiSuccess<T> | ApiErrorPayload;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      json &&
      typeof json === "object" &&
      "error" in json &&
      json.error &&
      typeof json.error.message === "string"
        ? json.error.message
        : "Request failed.";

    throw new Error(message);
  }

  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Invalid API response.");
  }

  return json.data as T;
}

export function getAdAvailability() {
  return requestJson<AdAvailabilityDTO>("/api/ads/availability", {
    method: "GET",
  });
}

export function getCurrentAdCampaign() {
  return requestJson<AdCampaignDTO | null>("/api/ads/campaign", {
    method: "GET",
  });
}

export function createAdCampaign(input: CreateAdCampaignInput) {
  return requestJson<CreateAdCampaignResponse>("/api/ads/campaign", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelAdCampaign() {
  return requestJson<CancelAdCampaignResponse>("/api/ads/campaign/cancel", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

