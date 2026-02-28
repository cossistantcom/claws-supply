import { jsonError, jsonSuccess, resolveApiError } from "@/lib/api/response";
import { getBaseUrlFromRequest } from "@/lib/api/request";
import { getSessionFromRequest } from "@/lib/auth/session";
import { createStripeConnectOnboardingLink } from "@/lib/profile/server";
import type { ConnectStripeResponse } from "@/lib/profile/types";

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
