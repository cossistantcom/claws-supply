import { jsonError, jsonSuccess, resolveApiError } from "@/lib/api/response";
import { getSessionFromRequest } from "@/lib/auth/session";
import { auth } from "@/lib/auth-server";
import { getProfileForUser } from "@/lib/profile/server";
import type { ConnectXResponse } from "@/lib/profile/types";

function readSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? [setCookieHeader] : [];
}

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
        callbackURL: "/api/profile/x/complete",
        disableRedirect: true,
      },
      returnHeaders: true,
    });

    const linkResponse =
      linkResult &&
      typeof linkResult === "object" &&
      "response" in linkResult &&
      linkResult.response &&
      typeof linkResult.response === "object"
        ? linkResult.response
        : linkResult && typeof linkResult === "object"
          ? linkResult
          : null;
    const linkHeaders =
      linkResult &&
      typeof linkResult === "object" &&
      "headers" in linkResult &&
      linkResult.headers instanceof Headers
        ? linkResult.headers
        : null;
    const linkUrl =
      linkResponse &&
      typeof linkResponse === "object" &&
      "url" in linkResponse &&
      typeof linkResponse.url === "string"
        ? linkResponse.url
        : null;

    const response = jsonSuccess<ConnectXResponse>({
      url: linkUrl,
      alreadyLinked: false,
    });

    if (linkHeaders) {
      const setCookieHeaders = readSetCookieHeaders(linkHeaders);

      for (const setCookieHeader of setCookieHeaders) {
        response.headers.append("set-cookie", setCookieHeader);
      }
    }

    return response;
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
