import { jsonError, jsonSuccess } from "@/lib/api/response";
import { enforceCliDeviceTokenRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { requireCliActorFromToken } from "@/lib/cli/auth";
import { postToDeviceAuthEndpoint, parseDeviceAuthError } from "@/lib/cli/device-auth";
import { cliDeviceTokenRequestSchema } from "@/lib/cli/schemas";
import { computePublisherHash } from "@/lib/templates/signing";

const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

function resolveAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    access_token?: unknown;
  };

  if (typeof candidate.access_token !== "string") {
    return null;
  }

  const token = candidate.access_token.trim();
  return token.length > 0 ? token : null;
}

export async function POST(request: Request) {
  try {
    const rateLimitedResponse = await enforceCliDeviceTokenRateLimit(request);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const input = await parseJsonBodyWithSchema(request, cliDeviceTokenRequestSchema);
    const response = await postToDeviceAuthEndpoint({
      request,
      path: "/device/token",
      body: {
        grant_type: DEVICE_GRANT_TYPE,
        device_code: input.deviceCode,
        client_id: input.clientId,
      },
    });

    if (response.status >= 400) {
      return jsonError(
        parseDeviceAuthError(response.payload, "Unable to complete device authorization."),
        {
          code: "CLI_DEVICE_AUTH_TOKEN_ERROR",
          status: response.status,
        },
      );
    }

    const accessToken = resolveAccessToken(response.payload);
    if (!accessToken) {
      return jsonError("Device token response is invalid.", {
        code: "CLI_DEVICE_AUTH_TOKEN_ERROR",
        status: 500,
      });
    }

    const actor = await requireCliActorFromToken(accessToken);

    return jsonSuccess({
      ...(response.payload as object),
      publisherHash: computePublisherHash(actor.email),
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to complete device authorization.",
      code: "CLI_DEVICE_AUTH_TOKEN_ERROR",
      status: 400,
    });
  }
}
