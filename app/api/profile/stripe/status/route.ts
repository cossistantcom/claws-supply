import { jsonError, jsonSuccess, resolveApiError } from "@/lib/api/response";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getStripeStatusForUser } from "@/lib/profile/server";
import type { StripeStatusDTO } from "@/lib/profile/types";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return jsonError("Unauthorized.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  try {
    const status = await getStripeStatusForUser(session.user.id, {
      strict: true,
    });

    return jsonSuccess<StripeStatusDTO>(status);
  } catch (error) {
    const resolvedError = resolveApiError(error, {
      message: "Unable to refresh Stripe account status.",
      code: "STRIPE_STATUS_ERROR",
      status: 400,
    });

    return jsonError(resolvedError.message, {
      status: resolvedError.status,
      code: resolvedError.code,
    });
  }
}

