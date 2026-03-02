import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { templateComment } from "@/lib/db/schema";
import { TemplateCommentServiceError } from "./errors";
import {
  getTemplateCommentById,
  requirePublishedTemplateForComments,
  resolveCommentViewer,
  type CommentActor,
} from "./read-service";
import type { TemplateComment } from "./types";

function assertCanPostComments(options: {
  viewerContext: Awaited<ReturnType<typeof resolveCommentViewer>>["viewerContext"];
  canPost: boolean;
}) {
  if (!options.viewerContext) {
    throw new TemplateCommentServiceError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  if (!options.canPost) {
    throw new TemplateCommentServiceError(
      "You must connect X or verify Stripe to comment.",
      {
        code: "COMMENT_VERIFICATION_REQUIRED",
        status: 403,
      },
    );
  }
}

export async function createTemplateCommentForTemplateSlug(options: {
  templateSlug: string;
  actor: CommentActor;
  body: string;
  parentId?: string;
}): Promise<TemplateComment> {
  const [{ viewerContext, viewer }, templateTarget] = await Promise.all([
    resolveCommentViewer(options.actor),
    requirePublishedTemplateForComments(options.templateSlug),
  ]);

  assertCanPostComments({
    viewerContext,
    canPost: viewer.canPost,
  });

  if (!viewerContext) {
    throw new TemplateCommentServiceError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  let parentCommentId: string | null = null;
  let depth = 0;

  if (options.parentId) {
    const [parent] = await db
      .select({
        id: templateComment.id,
        depth: templateComment.depth,
      })
      .from(templateComment)
      .where(
        and(
          eq(templateComment.id, options.parentId),
          eq(templateComment.templateId, templateTarget.id),
        ),
      )
      .limit(1);

    if (!parent) {
      throw new TemplateCommentServiceError("Parent comment not found.", {
        code: "PARENT_COMMENT_NOT_FOUND",
        status: 404,
      });
    }

    if (parent.depth >= 2) {
      throw new TemplateCommentServiceError("Maximum reply depth reached.", {
        code: "COMMENT_DEPTH_LIMIT",
        status: 400,
      });
    }

    parentCommentId = parent.id;
    depth = parent.depth + 1;
  }

  const now = new Date();
  const id = randomUUID();

  await db.insert(templateComment).values({
    id,
    templateId: templateTarget.id,
    userId: viewerContext.id,
    parentCommentId,
    depth,
    body: options.body.trim(),
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  const created = await getTemplateCommentById({
    templateId: templateTarget.id,
    commentId: id,
    viewerContext,
    viewer,
  });

  if (!created) {
    throw new TemplateCommentServiceError("Unable to create comment.", {
      code: "COMMENT_CREATE_FAILED",
      status: 500,
    });
  }

  return created;
}

export async function deleteTemplateCommentForTemplateSlug(options: {
  templateSlug: string;
  actor: CommentActor;
  commentId: string;
}): Promise<TemplateComment> {
  const [{ viewerContext, viewer }, templateTarget] = await Promise.all([
    resolveCommentViewer(options.actor),
    requirePublishedTemplateForComments(options.templateSlug),
  ]);

  if (!viewerContext) {
    throw new TemplateCommentServiceError("Unauthorized.", {
      code: "UNAUTHORIZED",
      status: 401,
    });
  }

  const [existing] = await db
    .select({
      id: templateComment.id,
      userId: templateComment.userId,
      deletedAt: templateComment.deletedAt,
    })
    .from(templateComment)
    .where(
      and(
        eq(templateComment.id, options.commentId),
        eq(templateComment.templateId, templateTarget.id),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new TemplateCommentServiceError("Comment not found.", {
      code: "COMMENT_NOT_FOUND",
      status: 404,
    });
  }

  const canDelete =
    isAdmin(viewerContext) || viewerContext.id === existing.userId;

  if (!canDelete) {
    throw new TemplateCommentServiceError("Forbidden.", {
      code: "FORBIDDEN",
      status: 403,
    });
  }

  if (!existing.deletedAt) {
    await db
      .update(templateComment)
      .set({
        body: "",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(templateComment.id, existing.id));
  }

  const deleted = await getTemplateCommentById({
    templateId: templateTarget.id,
    commentId: existing.id,
    viewerContext,
    viewer,
  });

  if (!deleted) {
    throw new TemplateCommentServiceError("Comment not found.", {
      code: "COMMENT_NOT_FOUND",
      status: 404,
    });
  }

  return deleted;
}
