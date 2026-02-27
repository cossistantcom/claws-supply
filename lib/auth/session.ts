import { headers } from "next/headers";
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

export async function getSessionFromNextHeaders() {
  const requestHeaders = await headers();

  return auth.api.getSession({
    headers: requestHeaders,
  });
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

