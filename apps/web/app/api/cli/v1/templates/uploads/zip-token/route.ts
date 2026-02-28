import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { jsonSuccess } from "@/lib/api/response";
import { enforceCliZipTokenRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { requireCliActorFromBearer } from "@/lib/cli/auth";
import { cliZipTokenRequestSchema } from "@/lib/cli/schemas";
import {
  getBlobTokenForAssetType,
  getUploadAllowedContentTypes,
  getUploadMaximumSize,
  getUploadValidityTimestamp,
} from "@/lib/templates/blob";
import { buildTemplateZipPathname } from "@/lib/templates/pathnames";

export async function POST(request: Request) {
  try {
    const actor = await requireCliActorFromBearer(request);
    const rateLimitedResponse = await enforceCliZipTokenRateLimit(request, actor.id);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const input = await parseJsonBodyWithSchema(request, cliZipTokenRequestSchema);

    const pathname = buildTemplateZipPathname(actor.id, input.slug, 1);
    const allowedContentTypes = [...getUploadAllowedContentTypes("zip")];
    const maximumSizeInBytes = getUploadMaximumSize("zip");

    const token = await generateClientTokenFromReadWriteToken({
      token: getBlobTokenForAssetType("zip"),
      pathname,
      allowedContentTypes,
      maximumSizeInBytes,
      validUntil: getUploadValidityTimestamp(),
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return jsonSuccess({
      token,
      pathname,
      allowedContentTypes,
      maximumSizeInBytes,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create zip upload token.",
      code: "CLI_TEMPLATE_ZIP_TOKEN_ERROR",
      status: 400,
    });
  }
}
