import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth-server";

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export class SessionRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "SessionRequiredError";
  }
}

export async function getSessionFromRequest(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

const getSessionFromNextHeadersCached = cache(async () => {
  const requestHeaders = await headers();

  return auth.api.getSession({
    headers: requestHeaders,
  });
});

export async function getSessionFromNextHeaders() {
  return getSessionFromNextHeadersCached();
}

export async function requireSessionFromRequest(
  request: Request,
): Promise<AuthSession> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new SessionRequiredError();
  }

  return session;
}

export async function requireSessionFromNextHeaders(): Promise<AuthSession> {
  const session = await getSessionFromNextHeaders();

  if (!session) {
    throw new SessionRequiredError();
  }

  return session;
}
