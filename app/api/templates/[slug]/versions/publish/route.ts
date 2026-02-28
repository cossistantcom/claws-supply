import { jsonSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  parseSlugParams,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import {
  publishTemplateVersionSchema,
} from "@/lib/templates/schemas";
import {
  assertCanManageTemplate,
  publishTemplateVersion,
  requireTemplateBySlug,
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
    const input = await parseJsonBodyWithSchema(
      request,
      publishTemplateVersionSchema,
    );
    const templateRow = await requireTemplateBySlug(slug);

    assertCanManageTemplate(session.user, templateRow);

    const published = await publishTemplateVersion(
      {
        id: session.user.id,
        role: session.user.role,
      },
      templateRow,
      input,
    );
    revalidateTemplatePublicPaths({
      slug: published.template.slug,
      category: published.template.category,
    });

    return jsonSuccess(published);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to publish template version.",
      code: "TEMPLATE_VERSION_PUBLISH_ERROR",
      status: 400,
    });
  }
}
