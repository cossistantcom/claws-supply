import { jsonSuccess } from "@/lib/api/response";
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

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const slug = await parseSlugParams(context.params);
    const input = await parseJsonBodyWithSchema(request, updateTemplateSchema);
    const templateRow = await requireTemplateBySlug(slug);

    assertCanManageTemplate(session.user, templateRow);
    const updated = await updateTemplateMetadata(templateRow, input);

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
