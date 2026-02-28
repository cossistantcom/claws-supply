import { jsonError, jsonSuccess } from "@/lib/api/response";
import { enforceCliDeviceDecisionRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError, requireSessionOrThrow } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { postToDeviceAuthEndpoint, parseDeviceAuthError } from "@/lib/cli/device-auth";
import { cliDeviceDecisionSchema } from "@/lib/cli/schemas";

export async function POST(request: Request) {
  try {
    const session = await requireSessionOrThrow(request);
    const rateLimitedResponse = await enforceCliDeviceDecisionRateLimit(
      request,
      session.user.id,
    );
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const input = await parseJsonBodyWithSchema(request, cliDeviceDecisionSchema);
    const response = await postToDeviceAuthEndpoint({
      request,
      path: "/device/deny",
      body: {
        userCode: input.userCode,
      },
    });

    if (response.status >= 400) {
      return jsonError(parseDeviceAuthError(response.payload, "Unable to deny device code."), {
        code: "CLI_DEVICE_AUTH_DENY_ERROR",
        status: response.status,
      });
    }

    return jsonSuccess(response.payload);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to deny device code.",
      code: "CLI_DEVICE_AUTH_DENY_ERROR",
      status: 400,
    });
  }
}
