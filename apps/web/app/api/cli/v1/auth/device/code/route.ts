import { jsonError, jsonSuccess } from "@/lib/api/response";
import { enforceCliDeviceCodeRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { postToDeviceAuthEndpoint, parseDeviceAuthError } from "@/lib/cli/device-auth";
import { cliDeviceCodeRequestSchema } from "@/lib/cli/schemas";

export async function POST(request: Request) {
  try {
    const rateLimitedResponse = await enforceCliDeviceCodeRateLimit(request);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const input = await parseJsonBodyWithSchema(request, cliDeviceCodeRequestSchema);
    const response = await postToDeviceAuthEndpoint({
      request,
      path: "/device/code",
      body: {
        client_id: input.clientId,
        ...(input.scope ? { scope: input.scope } : {}),
      },
    });

    if (response.status >= 400) {
      return jsonError(
        parseDeviceAuthError(response.payload, "Unable to initialize device authorization."),
        {
          code: "CLI_DEVICE_AUTH_CODE_ERROR",
          status: response.status,
        },
      );
    }

    return jsonSuccess(response.payload);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to initialize device authorization.",
      code: "CLI_DEVICE_AUTH_CODE_ERROR",
      status: 400,
    });
  }
}
