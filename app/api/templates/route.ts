import { jsonSuccess } from "@/lib/api/response";
import { enforcePublicCliReadRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseTemplateListQueryFromRequest } from "@/lib/templates/read-schemas";
import { listPublishedTemplates } from "@/lib/templates/read-service";

export async function GET(request: Request) {
  try {
    const rateLimitedResponse = await enforcePublicCliReadRateLimit(request);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const query = parseTemplateListQueryFromRequest(request);
    const result = await listPublishedTemplates(query);

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to list templates.",
      code: "TEMPLATE_LIST_ERROR",
      status: 400,
    });
  }
}
