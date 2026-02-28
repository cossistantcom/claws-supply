import { jsonError, resolveApiError } from "@/lib/api/response";
import { parseWithSchema } from "@/lib/api/validation";
import { getSessionFromRequest } from "@/lib/auth/session";
import { slugParamSchema } from "@/lib/templates/schemas";

export class ApiRouteError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "ApiRouteError";
    this.code = options?.code ?? "ROUTE_ERROR";
    this.status = options?.status ?? 400;
  }
}

export async function requireSessionOrThrow(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new ApiRouteError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  return session;
}

export async function parseSlugParams(
  paramsPromise: Promise<{
    slug: string;
  }>,
): Promise<string> {
  const { slug } = parseWithSchema(slugParamSchema, await paramsPromise);
  return slug;
}

export function handleRouteError(
  error: unknown,
  fallback: {
    message: string;
    code: string;
    status?: number;
  },
) {
  const resolvedError = resolveApiError(error, fallback);

  return jsonError(resolvedError.message, {
    code: resolvedError.code,
    status: resolvedError.status,
  });
}
