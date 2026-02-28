import { and, eq, gt } from "drizzle-orm";
import { ApiRouteError } from "@/lib/api/route-helpers";
import { db } from "@/lib/db";
import { session, user } from "@/lib/db/schema";

export type CliActor = {
  id: string;
  role: string | null;
  email: string;
  sessionToken: string;
};

function parseBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    throw new ApiRouteError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw new ApiRouteError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  const normalizedToken = token.trim();
  if (normalizedToken.length === 0) {
    throw new ApiRouteError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  return normalizedToken;
}

async function getCliActorFromToken(token: string): Promise<CliActor> {
  const now = new Date();

  const [record] = await db
    .select({
      userId: user.id,
      role: user.role,
      email: user.email,
      sessionToken: session.token,
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(and(eq(session.token, token), gt(session.expiresAt, now)))
    .limit(1);

  if (!record) {
    throw new ApiRouteError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  return {
    id: record.userId,
    role: record.role,
    email: record.email,
    sessionToken: record.sessionToken,
  };
}

export async function requireCliActorFromBearer(request: Request): Promise<CliActor> {
  const token = parseBearerToken(request);
  return getCliActorFromToken(token);
}

export async function requireCliActorFromToken(token: string): Promise<CliActor> {
  const normalizedToken = token.trim();
  if (normalizedToken.length === 0) {
    throw new ApiRouteError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  return getCliActorFromToken(normalizedToken);
}
