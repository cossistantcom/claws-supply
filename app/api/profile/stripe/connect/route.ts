import { jsonError, jsonSuccess, resolveApiError } from "@/lib/api/response";
import { getSessionFromRequest } from "@/lib/auth/session";
import { createStripeConnectOnboardingLink } from "@/lib/profile/server";
import type { ConnectStripeResponse } from "@/lib/profile/types";

function getBaseUrlFromRequest(request: Request): string {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProtocol && forwardedHost) {
    return `${forwardedProtocol}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
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
    const onboarding = await createStripeConnectOnboardingLink(
      session.user.id,
      getBaseUrlFromRequest(request),
    );

    return jsonSuccess<ConnectStripeResponse>(onboarding);
  } catch (error) {
    const resolvedError = resolveApiError(error, {
      message: "Unable to start Stripe onboarding.",
      code: "STRIPE_CONNECT_ERROR",
      status: 400,
    });

    return jsonError(resolvedError.message, {
      status: resolvedError.status,
      code: resolvedError.code,
    });
  }
}

