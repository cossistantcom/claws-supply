import { jsonSuccess } from "@/lib/api/response";
import { enforceCliSlugAvailabilityRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseWithSchema } from "@/lib/api/validation";
import { requireCliActorFromBearer } from "@/lib/cli/auth";
import { cliSlugAvailabilityQuerySchema } from "@/lib/cli/schemas";
import { getTemplateRecordBySlug } from "@/lib/templates/repository";

export async function GET(request: Request) {
  try {
    const actor = await requireCliActorFromBearer(request);
    const rateLimitedResponse = await enforceCliSlugAvailabilityRateLimit(
      request,
      actor.id,
    );
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const url = new URL(request.url);
    const { slug } = parseWithSchema(cliSlugAvailabilityQuerySchema, {
      slug: url.searchParams.get("slug"),
    });

    const existing = await getTemplateRecordBySlug(slug);

    return jsonSuccess({
      slug,
      available: !existing,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to validate slug availability.",
      code: "CLI_TEMPLATE_SLUG_AVAILABILITY_ERROR",
      status: 400,
    });
  }
}
