import { jsonSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  parseSlugParams,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import {
  enforceTemplateCommentsReadRateLimit,
  enforceTemplateCommentsWriteRateLimit,
} from "@/lib/api/rate-limit";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  createTemplateCommentSchema,
  parseTemplateCommentsQueryFromRequest,
} from "@/lib/templates/comments/schemas";
import {
  listTemplateCommentsBySlug,
  resolveCommentViewer,
} from "@/lib/templates/comments/read-service";
import { createTemplateCommentForTemplateSlug } from "@/lib/templates/comments/service";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const rateLimitedResponse = await enforceTemplateCommentsReadRateLimit(request);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const slug = await parseSlugParams(context.params);
    const query = parseTemplateCommentsQueryFromRequest(request);
    const session = await getSessionFromRequest(request);
    const { viewerContext, viewer } = await resolveCommentViewer(
      session
        ? {
            id: session.user.id,
            role: session.user.role,
          }
        : null,
    );

    const result = await listTemplateCommentsBySlug({
      templateSlug: slug,
      parentId: query.parentId,
      cursor: query.cursor,
      limit: query.limit,
      viewerContext,
      viewer,
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to fetch comments.",
      code: "TEMPLATE_COMMENTS_GET_ERROR",
      status: 400,
    });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const rateLimitedResponse = await enforceTemplateCommentsWriteRateLimit(
      request,
      session.user.id,
    );
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const slug = await parseSlugParams(context.params);
    const input = await parseJsonBodyWithSchema(request, createTemplateCommentSchema);

    const created = await createTemplateCommentForTemplateSlug({
      templateSlug: slug,
      actor: {
        id: session.user.id,
        role: session.user.role,
      },
      body: input.body,
      parentId: input.parentId,
    });

    return jsonSuccess(created, {
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create comment.",
      code: "TEMPLATE_COMMENTS_CREATE_ERROR",
      status: 400,
    });
  }
}
