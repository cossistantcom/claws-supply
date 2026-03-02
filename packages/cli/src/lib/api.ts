import { z, type ZodType } from "zod";
import {
  ApiErrorEnvelopeSchema,
  ApiSuccessEnvelopeSchema,
  DeviceCodeResponseSchema,
  DeviceTokenResponseSchema,
  PublishFinalizeResponseSchema,
  SlugAvailabilityResponseSchema,
  TemplateDetailResponseSchema,
  ZipUploadTokenResponseSchema,
  type DeviceCodeResponse,
  type DeviceTokenResponse,
  type PublishFinalizeResponse,
  type SlugAvailabilityResponse,
  type TemplateDetailResponse,
  type ZipUploadTokenResponse,
} from "../schemas/api";
import { USER_AGENT } from "./constants";
import { CliError, EXIT_CODES } from "../utils/errors";

const DEFAULT_TIMEOUT_MS = 15_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

type RequestOptions<T> = {
  baseUrl: string;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
  token?: string;
  schema: ZodType<T>;
  timeoutMs?: number;
};

export type TemplateArchiveDownloadResponse = {
  zipBytes: Uint8Array;
  fileName: string | null;
  contentType: string | null;
  contentLength: number | null;
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

function isRetriableCliError(error: CliError): boolean {
  return (
    error.message.startsWith("Network request failed:") ||
    error.message.startsWith("Request timed out:")
  );
}

function parseContentDispositionFilename(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const encodedMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const quotedMatch = value.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = value.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return null;
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
      if (!isRetriableCliError(error)) {
        throw error;
      }

      return executeRequest(options);
    }

    throw error;
  }
}

async function executeTemplateArchiveDownload(input: {
  baseUrl: string;
  slug: string;
  token?: string;
  timeoutMs?: number;
}): Promise<TemplateArchiveDownloadResponse> {
  const endpoint = `${normalizeBaseUrl(input.baseUrl)}/api/templates/${encodeURIComponent(input.slug)}/download`;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, input.timeoutMs ?? DOWNLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        ...(input.token
          ? {
              Authorization: `Bearer ${input.token}`,
            }
          : {}),
      },
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

  if (!response.ok) {
    const payload = await parseJsonSafe(response);
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

  const buffer = await response.arrayBuffer();

  return {
    zipBytes: new Uint8Array(buffer),
    fileName: parseContentDispositionFilename(response.headers.get("Content-Disposition")),
    contentType: response.headers.get("Content-Type"),
    contentLength: (() => {
      const raw = response.headers.get("Content-Length");
      if (!raw) {
        return null;
      }

      const parsed = Number.parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : null;
    })(),
  };
}

export async function downloadTemplateArchive(input: {
  baseUrl: string;
  slug: string;
  token?: string;
}): Promise<TemplateArchiveDownloadResponse> {
  try {
    return await executeTemplateArchiveDownload(input);
  } catch (error) {
    if (error instanceof ApiHttpError) {
      throw error;
    }

    if (error instanceof CliError) {
      if (!isRetriableCliError(error)) {
        throw error;
      }

      return executeTemplateArchiveDownload(input);
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

export async function fetchTemplateDetail(input: {
  baseUrl: string;
  slug: string;
}): Promise<TemplateDetailResponse> {
  return requestWithRetry({
    baseUrl: input.baseUrl,
    path: `/api/templates/${encodeURIComponent(input.slug)}`,
    method: "GET",
    schema: TemplateDetailResponseSchema,
  });
}
