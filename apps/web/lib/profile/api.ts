import type {
  ConnectStripeResponse,
  ConnectXResponse,
  DeleteAccountResponse,
  ProfileDTO,
  ProfileUpdateInput,
  StripeStatusDTO,
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

export function getProfile() {
  return requestJson<ProfileDTO>("/api/profile", {
    method: "GET",
  });
}

export function updateProfile(input: ProfileUpdateInput) {
  return requestJson<ProfileDTO>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function connectXAccount() {
  return requestJson<ConnectXResponse>("/api/profile/x/connect", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function connectStripeAccount() {
  return requestJson<ConnectStripeResponse>("/api/profile/stripe/connect", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function refreshStripeStatus() {
  return requestJson<StripeStatusDTO>("/api/profile/stripe/status", {
    method: "GET",
  });
}

export function deleteCurrentAccount() {
  return requestJson<DeleteAccountResponse>("/api/profile", {
    method: "DELETE",
    body: JSON.stringify({}),
  });
}

