import { jsonSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  parseSlugParams,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import {
  assertCanManageTemplate,
  requireTemplateBySlug,
  unpublishTemplate,
} from "@/lib/templates/service";
import { revalidateTemplatePublicPaths } from "@/lib/templates/revalidate";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const slug = await parseSlugParams(context.params);
    const templateRow = await requireTemplateBySlug(slug);

    assertCanManageTemplate(session.user, templateRow);

    const updated = await unpublishTemplate(templateRow);
    revalidateTemplatePublicPaths({
      slug: updated.slug,
      category: updated.category,
    });

    return jsonSuccess({
      status: updated.status,
      unpublishedAt: updated.unpublishedAt,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to unpublish template.",
      code: "TEMPLATE_UNPUBLISH_ERROR",
      status: 400,
    });
  }
}
