import { jsonError, jsonSuccess } from "@/lib/api/response";
import { enforcePublicCliReadRateLimit } from "@/lib/api/rate-limit";
import {
  handleRouteError,
  parseSlugParams,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import {
  updateTemplateSchema,
} from "@/lib/templates/schemas";
import {
  assertCanManageTemplate,
  requireTemplateBySlug,
  softDeleteTemplate,
  updateTemplateMetadata,
} from "@/lib/templates/service";
import { revalidateTemplatePublicPaths } from "@/lib/templates/revalidate";
import { getPublishedTemplateBySlug } from "@/lib/templates/read-service";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const rateLimitedResponse = await enforcePublicCliReadRateLimit(request);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const slug = await parseSlugParams(context.params);
    const detail = await getPublishedTemplateBySlug(slug);

    if (!detail) {
      return jsonError("Template not found.", {
        code: "TEMPLATE_NOT_FOUND",
        status: 404,
      });
    }

    return jsonSuccess(detail);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to fetch template.",
      code: "TEMPLATE_GET_ERROR",
      status: 400,
    });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const slug = await parseSlugParams(context.params);
    const input = await parseJsonBodyWithSchema(request, updateTemplateSchema);
    const templateRow = await requireTemplateBySlug(slug);

    assertCanManageTemplate(session.user, templateRow);
    const updated = await updateTemplateMetadata(templateRow, input);
    revalidateTemplatePublicPaths({
      slug: updated.slug,
      category: updated.category,
      previousCategory: templateRow.category,
    });

    return jsonSuccess(updated);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to update template.",
      code: "TEMPLATE_UPDATE_ERROR",
      status: 400,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const slug = await parseSlugParams(context.params);
    const templateRow = await requireTemplateBySlug(slug);

    assertCanManageTemplate(session.user, templateRow);
    await softDeleteTemplate(templateRow);
    revalidateTemplatePublicPaths({
      slug: templateRow.slug,
      category: templateRow.category,
    });

    return jsonSuccess({
      success: true,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to delete template.",
      code: "TEMPLATE_DELETE_ERROR",
      status: 400,
    });
  }
}
