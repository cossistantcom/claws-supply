import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextResponse } from "next/server";
import { jsonError } from "./response";

const RATE_LIMITED_MESSAGE = "Too many requests. Please try again later.";

type RateLimitPolicy = {
  prefix: string;
  window: `${number} m`;
  limit: number;
};

const RATE_LIMIT_POLICIES = {
  publicCliRead: {
    prefix: "public-cli-read",
    window: "1 m",
    limit: 60,
  },
  cliDeviceCodeByIp: {
    prefix: "cli-device-code-ip",
    window: "1 m",
    limit: 20,
  },
  cliDeviceTokenByIp: {
    prefix: "cli-device-token-ip",
    window: "1 m",
    limit: 120,
  },
  cliDeviceDecisionByUser: {
    prefix: "cli-device-decision-user",
    window: "1 m",
    limit: 30,
  },
  cliSlugAvailabilityByUser: {
    prefix: "cli-slug-availability-user",
    window: "1 m",
    limit: 60,
  },
  cliZipTokenByUser: {
    prefix: "cli-zip-token-user",
    window: "1 m",
    limit: 30,
  },
  cliPublishByUser: {
    prefix: "cli-publish-user",
    window: "1 m",
    limit: 15,
  },
  templateCommentsReadByIp: {
    prefix: "template-comments-read-ip",
    window: "1 m",
    limit: 180,
  },
  templateCommentsWriteByUser: {
    prefix: "template-comments-write-user",
    window: "1 m",
    limit: 30,
  },
  templateCommentsDeleteByUser: {
    prefix: "template-comments-delete-user",
    window: "1 m",
    limit: 30,
  },
} as const satisfies Record<string, RateLimitPolicy>;

const limiterCache = new Map<string, Ratelimit>();
let missingConfigLogged = false;
let initializationErrorLogged = false;
let cachedRedisClient: Redis | null = null;

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

function getRedisClient(): Redis | null {
  if (cachedRedisClient) {
    return cachedRedisClient;
  }

  const config = getUpstashConfig();
  if (!config) {
    return null;
  }

  try {
    cachedRedisClient = new Redis(config);
    return cachedRedisClient;
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

function getRateLimiter(policy: RateLimitPolicy): Ratelimit | null {
  const cached = limiterCache.get(policy.prefix);
  if (cached) {
    return cached;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: policy.prefix,
  });

  limiterCache.set(policy.prefix, limiter);
  return limiter;
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
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.publicCliRead);
  if (!limiter) {
    return null;
  }

  const clientIp = resolveClientIp(request);
  return enforceRateLimit(request, limiter, clientIp);
}

async function enforceRateLimit(
  request: Request,
  limiter: Ratelimit,
  bucketKey: string,
): Promise<NextResponse | null> {
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

export async function enforceCliDeviceCodeRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.cliDeviceCodeByIp);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, resolveClientIp(request));
}

export async function enforceCliDeviceTokenRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.cliDeviceTokenByIp);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, resolveClientIp(request));
}

export async function enforceCliDeviceDecisionRateLimit(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.cliDeviceDecisionByUser);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, userId);
}

export async function enforceCliSlugAvailabilityRateLimit(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.cliSlugAvailabilityByUser);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, userId);
}

export async function enforceCliZipTokenRateLimit(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.cliZipTokenByUser);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, userId);
}

export async function enforceCliPublishRateLimit(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.cliPublishByUser);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, userId);
}

export async function enforceTemplateCommentsReadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.templateCommentsReadByIp);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, resolveClientIp(request));
}

export async function enforceTemplateCommentsWriteRateLimit(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.templateCommentsWriteByUser);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, userId);
}

export async function enforceTemplateCommentsDeleteRateLimit(
  request: Request,
  userId: string,
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(RATE_LIMIT_POLICIES.templateCommentsDeleteByUser);
  if (!limiter) {
    return null;
  }

  return enforceRateLimit(request, limiter, userId);
}
