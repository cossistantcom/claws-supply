import { jsonSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  parseSlugParams,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import { enforceTemplateCommentsDeleteRateLimit } from "@/lib/api/rate-limit";
import { parseWithSchema } from "@/lib/api/validation";
import { commentIdParamSchema } from "@/lib/templates/comments/schemas";
import { deleteTemplateCommentForTemplateSlug } from "@/lib/templates/comments/service";

type RouteContext = {
  params: Promise<{
    slug: string;
    commentId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const rateLimitedResponse = await enforceTemplateCommentsDeleteRateLimit(
      request,
      session.user.id,
    );
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const slug = await parseSlugParams(context.params);
    const { commentId } = parseWithSchema(commentIdParamSchema, await context.params);

    const deleted = await deleteTemplateCommentForTemplateSlug({
      templateSlug: slug,
      actor: {
        id: session.user.id,
        role: session.user.role,
      },
      commentId,
    });

    return jsonSuccess(deleted);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to delete comment.",
      code: "TEMPLATE_COMMENTS_DELETE_ERROR",
      status: 400,
    });
  }
}
