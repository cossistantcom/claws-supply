import { jsonSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  parseSlugParams,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { publishTemplateSchema } from "@/lib/templates/schemas";
import {
  assertCanManageTemplate,
  publishTemplate,
  requireTemplateBySlug,
} from "@/lib/templates/service";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const slug = await parseSlugParams(context.params);
    const input = await parseJsonBodyWithSchema(request, publishTemplateSchema);
    const templateRow = await requireTemplateBySlug(slug);

    assertCanManageTemplate(session.user, templateRow);

    const published = await publishTemplate(
      {
        id: session.user.id,
        role: session.user.role,
      },
      templateRow,
      input,
    );

    return jsonSuccess(published);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to publish template.",
      code: "TEMPLATE_PUBLISH_ERROR",
      status: 400,
    });
  }
}
