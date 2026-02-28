import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  data: T;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

type ApiErrorLike = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

export function jsonSuccess<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, init);
}

export function jsonError(
  message: string,
  options?: {
    status?: number;
    code?: string;
  },
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      error: {
        code: options?.code ?? "INTERNAL_ERROR",
        message,
      },
    },
    {
      status: options?.status ?? 500,
    },
  );
}

export function resolveApiError(
  error: unknown,
  fallback: {
    message: string;
    code?: string;
    status?: number;
  },
): {
  message: string;
  code: string;
  status: number;
} {
  const fallbackStatus = fallback.status ?? 500;
  const fallbackCode = fallback.code ?? "INTERNAL_ERROR";

  if (!error || typeof error !== "object") {
    return {
      message: fallback.message,
      code: fallbackCode,
      status: fallbackStatus,
    };
  }

  const candidate = error as ApiErrorLike;
  const message =
    typeof candidate.message === "string" && candidate.message.trim().length > 0
      ? candidate.message
      : fallback.message;
  const code =
    typeof candidate.code === "string" && candidate.code.trim().length > 0
      ? candidate.code
      : fallbackCode;
  const status =
    typeof candidate.status === "number"
      ? candidate.status
      : typeof candidate.statusCode === "number"
        ? candidate.statusCode
        : fallbackStatus;

  return {
    message,
    code,
    status,
  };
}

