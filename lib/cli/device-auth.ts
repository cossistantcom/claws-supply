import { getBaseUrlFromRequest } from "@/lib/api/request";

type DeviceAuthPostResult = {
  status: number;
  payload: unknown;
};

export async function postToDeviceAuthEndpoint(options: {
  request: Request;
  path: "/device/code" | "/device/token" | "/device/approve" | "/device/deny";
  body: unknown;
}): Promise<DeviceAuthPostResult> {
  const baseUrl = getBaseUrlFromRequest(options.request);
  const response = await fetch(`${baseUrl}/api/auth${options.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.request.headers.get("cookie")
        ? {
            cookie: options.request.headers.get("cookie")!,
          }
        : {}),
      ...(options.request.headers.get("authorization")
        ? {
            authorization: options.request.headers.get("authorization")!,
          }
        : {}),
    },
    body: JSON.stringify(options.body),
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    status: response.status,
    payload,
  };
}

export function parseDeviceAuthError(payload: unknown, fallbackMessage: string): string {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }

  const body = payload as {
    error?: unknown;
    error_description?: unknown;
    message?: unknown;
  };

  if (typeof body.error_description === "string" && body.error_description.length > 0) {
    return body.error_description;
  }

  if (typeof body.message === "string" && body.message.length > 0) {
    return body.message;
  }

  if (typeof body.error === "string" && body.error.length > 0) {
    return body.error;
  }

  return fallbackMessage;
}
