import { jsonError, jsonSuccess, resolveApiError } from "@/lib/api/response";
import { getSessionFromRequest } from "@/lib/auth/session";
import { auth } from "@/lib/auth-server";
import { getProfileForUser } from "@/lib/profile/server";
import type { ConnectXResponse } from "@/lib/profile/types";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return jsonError("Unauthorized.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  try {
    const profile = await getProfileForUser(session.user.id);

    if (profile.x.linked) {
      return jsonSuccess<ConnectXResponse>({
        url: null,
        alreadyLinked: true,
      });
    }

    const linkResult = await auth.api.linkSocialAccount({
      headers: request.headers,
      body: {
        provider: "twitter",
        callbackURL: "/profile",
        disableRedirect: true,
      },
    });

    return jsonSuccess<ConnectXResponse>({
      url: typeof linkResult?.url === "string" ? linkResult.url : null,
      alreadyLinked: false,
    });
  } catch (error) {
    const resolvedError = resolveApiError(error, {
      message: "Unable to start X account linking.",
      code: "X_CONNECT_ERROR",
      status: 400,
    });

    return jsonError(resolvedError.message, {
      status: resolvedError.status,
      code: resolvedError.code,
    });
  }
}

