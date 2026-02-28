import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextResponse } from "next/server";
import { jsonError } from "./response";

const PUBLIC_CLI_READ_BUCKET_PREFIX = "public-cli-read";
const PUBLIC_CLI_READ_WINDOW = "1 m";
const PUBLIC_CLI_READ_LIMIT = 60;
const RATE_LIMITED_MESSAGE = "Too many requests. Please try again later.";

let publicCliReadLimiter: Ratelimit | null = null;
let missingConfigLogged = false;
let initializationErrorLogged = false;

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    if (!missingConfigLogged) {
      console.warn(
        "[rate-limit] Missing Upstash config. Rate limiting is disabled (fail-open).",
      );
      missingConfigLogged = true;
    }

    return null;
  }

  return {
    url,
    token,
  };
}

function getPublicCliReadLimiter(): Ratelimit | null {
  if (publicCliReadLimiter) {
    return publicCliReadLimiter;
  }

  const config = getUpstashConfig();
  if (!config) {
    return null;
  }

  try {
    const redis = new Redis(config);
    publicCliReadLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(PUBLIC_CLI_READ_LIMIT, PUBLIC_CLI_READ_WINDOW),
      prefix: PUBLIC_CLI_READ_BUCKET_PREFIX,
    });
    return publicCliReadLimiter;
  } catch (error) {
    if (!initializationErrorLogged) {
      console.error(
        "[rate-limit] Failed to initialize Upstash rate limiter. Falling back to fail-open.",
        error,
      );
      initializationErrorLogged = true;
    }

    return null;
  }
}

function resolveClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const xRealIp = request.headers.get("x-real-ip")?.trim();
  if (xRealIp) {
    return xRealIp;
  }

  return "unknown";
}

function toNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function setRateLimitHeaders(
  response: NextResponse,
  result: {
    limit: unknown;
    remaining: unknown;
    reset: unknown;
  },
) {
  const limit = toNumber(result.limit);
  const remaining = toNumber(result.remaining);
  const resetRaw = toNumber(result.reset);

  if (limit !== null) {
    response.headers.set("X-RateLimit-Limit", String(limit));
  }

  if (remaining !== null) {
    response.headers.set("X-RateLimit-Remaining", String(remaining));
  }

  if (resetRaw !== null) {
    // Upstash reset values are typically milliseconds since epoch, but some
    // environments may surface seconds. Normalize to ms before deriving headers.
    const resetEpochMs = resetRaw > 1_000_000_000_000 ? resetRaw : resetRaw * 1000;
    const resetEpochSeconds = Math.max(0, Math.ceil(resetEpochMs / 1000));
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((resetEpochMs - Date.now()) / 1000),
    );
    response.headers.set("X-RateLimit-Reset", String(resetEpochSeconds));
    response.headers.set("Retry-After", String(retryAfterSeconds));
  }
}

export async function enforcePublicCliReadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const limiter = getPublicCliReadLimiter();
  if (!limiter) {
    return null;
  }

  const clientIp = resolveClientIp(request);
  const bucketKey = clientIp;

  try {
    const result = await limiter.limit(bucketKey);

    if (result.success) {
      return null;
    }

    const response = jsonError(RATE_LIMITED_MESSAGE, {
      status: 429,
      code: "RATE_LIMITED",
    });
    setRateLimitHeaders(response, result);
    return response;
  } catch (error) {
    console.error(
      `[rate-limit] Upstash rate-limit check failed for ${request.url}. Falling back to fail-open.`,
      error,
    );
    return null;
  }
}
