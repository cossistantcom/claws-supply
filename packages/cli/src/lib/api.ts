import { z, type ZodType } from "zod";
import {
  ApiErrorEnvelopeSchema,
  ApiSuccessEnvelopeSchema,
  DeviceCodeResponseSchema,
  DeviceTokenResponseSchema,
  PublishFinalizeResponseSchema,
  SlugAvailabilityResponseSchema,
  ZipUploadTokenResponseSchema,
  type DeviceCodeResponse,
  type DeviceTokenResponse,
  type PublishFinalizeResponse,
  type SlugAvailabilityResponse,
  type ZipUploadTokenResponse,
} from "../schemas/api";
import { USER_AGENT } from "./constants";
import { CliError, EXIT_CODES } from "../utils/errors";

const DEFAULT_TIMEOUT_MS = 15_000;

type RequestOptions<T> = {
  baseUrl: string;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  token?: string;
  schema: ZodType<T>;
  timeoutMs?: number;
};

export class ApiHttpError extends CliError {
  readonly retryAfterSeconds?: number;
  readonly endpoint: string;

  constructor(message: string, options: {
    status: number;
    code?: string;
    retryAfterSeconds?: number;
    endpoint: string;
  }) {
    super(message, {
      exitCode: EXIT_CODES.NETWORK_OR_API,
      status: options.status,
      code: options.code,
    });
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.endpoint = options.endpoint;
  }
}

function parseRetryAfterSeconds(headerValue: string | null): number | undefined {
  if (!headerValue) {
    return undefined;
  }

  const numeric = Number.parseInt(headerValue, 10);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  return undefined;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function executeRequest<T>(options: RequestOptions<T>): Promise<T> {
  const endpoint = `${normalizeBaseUrl(options.baseUrl)}${options.path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new CliError(`Request timed out: ${endpoint}`, {
        exitCode: EXIT_CODES.NETWORK_OR_API,
        cause: error,
      });
    }

    throw new CliError(`Network request failed: ${endpoint}`, {
      exitCode: EXIT_CODES.NETWORK_OR_API,
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const parsedError = ApiErrorEnvelopeSchema.safeParse(payload);
    const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get("Retry-After"));

    throw new ApiHttpError(
      parsedError.success
        ? parsedError.data.error.message
        : `API request failed with status ${response.status}.`,
      {
        status: response.status,
        code: parsedError.success ? parsedError.data.error.code : undefined,
        retryAfterSeconds,
        endpoint,
      },
    );
  }

  const envelope = ApiSuccessEnvelopeSchema.safeParse(payload);
  if (!envelope.success) {
    throw new CliError(`API returned an invalid response envelope from ${endpoint}.`, {
      exitCode: EXIT_CODES.NETWORK_OR_API,
    });
  }

  const parsed = options.schema.safeParse(envelope.data.data);
  if (!parsed.success) {
    throw new CliError(
      `API response validation failed for ${options.path}: ${z.prettifyError(parsed.error)}`,
      {
        exitCode: EXIT_CODES.NETWORK_OR_API,
      },
    );
  }

  return parsed.data;
}

export async function requestWithRetry<T>(options: RequestOptions<T>): Promise<T> {
  try {
    return await executeRequest(options);
  } catch (error) {
    if (error instanceof ApiHttpError) {
      throw error;
    }

    if (error instanceof CliError) {
      const retriable =
        error.message.startsWith("Network request failed:") ||
        error.message.startsWith("Request timed out:");
      if (!retriable) {
        throw error;
      }

      return executeRequest(options);
    }

    throw error;
  }
}

export async function startDeviceAuthorization(input: {
  baseUrl: string;
  clientId: string;
}): Promise<DeviceCodeResponse> {
  return requestWithRetry({
    baseUrl: input.baseUrl,
    path: "/api/cli/v1/auth/device/code",
    method: "POST",
    body: {
      clientId: input.clientId,
    },
    schema: DeviceCodeResponseSchema,
  });
}

export async function pollDeviceAuthorizationToken(input: {
  baseUrl: string;
  clientId: string;
  deviceCode: string;
}): Promise<DeviceTokenResponse> {
  return requestWithRetry({
    baseUrl: input.baseUrl,
    path: "/api/cli/v1/auth/device/token",
    method: "POST",
    body: {
      clientId: input.clientId,
      deviceCode: input.deviceCode,
    },
    schema: DeviceTokenResponseSchema,
  });
}

export async function checkSlugAvailability(input: {
  baseUrl: string;
  token: string;
  slug: string;
}): Promise<SlugAvailabilityResponse> {
  return requestWithRetry({
    baseUrl: input.baseUrl,
    path: `/api/cli/v1/templates/slug-availability?slug=${encodeURIComponent(input.slug)}`,
    method: "GET",
    token: input.token,
    schema: SlugAvailabilityResponseSchema,
  });
}

export async function createZipUploadToken(input: {
  baseUrl: string;
  token: string;
  slug: string;
}): Promise<ZipUploadTokenResponse> {
  return requestWithRetry({
    baseUrl: input.baseUrl,
    path: "/api/cli/v1/templates/uploads/zip-token",
    method: "POST",
    token: input.token,
    body: {
      slug: input.slug,
    },
    schema: ZipUploadTokenResponseSchema,
  });
}

export async function finalizeTemplatePublish(input: {
  baseUrl: string;
  token: string;
  title: string;
  slug: string;
  pathname: string;
}): Promise<PublishFinalizeResponse> {
  return requestWithRetry({
    baseUrl: input.baseUrl,
    path: "/api/cli/v1/templates/publish",
    method: "POST",
    token: input.token,
    body: {
      title: input.title,
      slug: input.slug,
      zipUpload: {
        pathname: input.pathname,
      },
    },
    schema: PublishFinalizeResponseSchema,
  });
}
