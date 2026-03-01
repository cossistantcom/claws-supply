import { jsonError, jsonSuccess } from "@/lib/api/response";
import { enforceCliDeviceDecisionRateLimit } from "@/lib/api/rate-limit";
import { requireSessionOrThrow } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { auth } from "@/lib/auth-server";
import {
  parseDeviceAuthApiError,
  resolveDeviceAuthApiErrorStatus,
} from "@/lib/cli/device-auth";
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
    const response = await auth.api.deviceDeny({
      headers: request.headers,
      body: {
        userCode: input.userCode,
      },
    });

    return jsonSuccess(response);
  } catch (error) {
    return jsonError(parseDeviceAuthApiError(error, "Unable to deny device code."), {
      code: "CLI_DEVICE_AUTH_DENY_ERROR",
      status: resolveDeviceAuthApiErrorStatus(error, 400),
    });
  }
}
