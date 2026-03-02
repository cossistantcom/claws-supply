import "server-only";

import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import { isAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { template, templateComment, user } from "@/lib/db/schema";
import { isUserVerified } from "@/lib/profile/verification";
import { TemplateCommentServiceError } from "./errors";
import type {
  CommentViewerContext,
  CommentViewerPermissions,
  TemplateComment,
  TemplateCommentConnection,
} from "./types";

const DEFAULT_COMMENT_LIMIT = 20;
const MAX_COMMENT_LIMIT = 40;

type CommentSortCursor = {
  createdAt: string;
  id: string;
};

type CommentReadRow = {
  id: string;
  templateId: string;
  userId: string;
  parentCommentId: string | null;
  depth: number;
  body: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorUsername: string;
  authorName: string;
  authorAvatar: string | null;
  authorXAccountId: string | null;
  authorStripeVerified: boolean;
};

type PublishedTemplateTarget = {
  id: string;
  slug: string;
};

export type CommentActor = {
  id: string;
  role?: string | null;
};

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_COMMENT_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit ?? DEFAULT_COMMENT_LIMIT), 1), MAX_COMMENT_LIMIT);
}

function encodeCursor(input: { createdAt: Date; id: string }) {
  const payload: CommentSortCursor = {
    createdAt: input.createdAt.toISOString(),
    id: input.id,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CommentSortCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as CommentSortCursor;

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string"
    ) {
      throw new Error("invalid cursor");
    }

    const date = new Date(parsed.createdAt);
    if (Number.isNaN(date.getTime())) {
      throw new Error("invalid cursor date");
    }

    if (parsed.id.trim().length === 0) {
      throw new Error("invalid cursor id");
    }

    return parsed;
  } catch {
    throw new TemplateCommentServiceError("Invalid comment cursor.", {
      code: "COMMENT_CURSOR_INVALID",
      status: 400,
    });
  }
}

export async function requirePublishedTemplateForComments(
  templateSlug: string,
): Promise<PublishedTemplateTarget> {
  const [row] = await db
    .select({
      id: template.id,
      slug: template.slug,
    })
    .from(template)
    .where(
      and(
        eq(template.slug, templateSlug),
        eq(template.status, "published"),
        eq(template.isFlagged, false),
        isNull(template.deletedAt),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TemplateCommentServiceError("Template not found.", {
      code: "TEMPLATE_NOT_FOUND",
      status: 404,
    });
  }

  return row;
}

export async function resolveCommentViewer(
  actor: CommentActor | null,
): Promise<{
  viewerContext: CommentViewerContext | null;
  viewer: CommentViewerPermissions;
}> {
  if (!actor) {
    return {
      viewerContext: null,
      viewer: {
        isAuthenticated: false,
        canPost: false,
      },
    };
  }

  const [row] = await db
    .select({
      id: user.id,
      role: user.role,
      xAccountId: user.xAccountId,
      stripeVerified: user.stripeVerified,
    })
    .from(user)
    .where(eq(user.id, actor.id))
    .limit(1);

  if (!row) {
    return {
      viewerContext: null,
      viewer: {
        isAuthenticated: false,
        canPost: false,
      },
    };
  }

  const viewerContext: CommentViewerContext = {
    id: row.id,
    role: actor.role ?? row.role,
    xAccountId: row.xAccountId,
    stripeVerified: row.stripeVerified,
  };

  return {
    viewerContext,
    viewer: {
      isAuthenticated: true,
      canPost:
        isAdmin(viewerContext) ||
        Boolean(viewerContext.xAccountId) ||
        viewerContext.stripeVerified,
    },
  };
}

function mapCommentRow(options: {
  row: CommentReadRow;
  replyCount: number;
  viewerContext: CommentViewerContext | null;
  viewer: CommentViewerPermissions;
}): TemplateComment {
  const { row } = options;
  const isDeleted = row.deletedAt !== null;

  return {
    id: row.id,
    templateId: row.templateId,
    userId: row.userId,
    parentCommentId: row.parentCommentId,
    depth: row.depth,
    body: isDeleted ? "Comment deleted" : row.body,
    isDeleted,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    replyCount: options.replyCount,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorName,
      avatarUrl: row.authorAvatar,
      isVerified: isUserVerified({
        hasVerifiedTwitterProfile: Boolean(row.authorXAccountId),
        hasVerifiedStripeIdentity: row.authorStripeVerified,
      }),
    },
    permissions: {
      canReply: options.viewer.canPost && row.depth < 2,
      canDelete: Boolean(
        options.viewerContext &&
          (isAdmin(options.viewerContext) || options.viewerContext.id === row.userId),
      ),
    },
  };
}

async function requireTemplateParentComment(options: {
  templateId: string;
  parentId: string;
}) {
  const [row] = await db
    .select({
      id: templateComment.id,
    })
    .from(templateComment)
    .where(
      and(
        eq(templateComment.id, options.parentId),
        eq(templateComment.templateId, options.templateId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TemplateCommentServiceError("Parent comment not found.", {
      code: "PARENT_COMMENT_NOT_FOUND",
      status: 404,
    });
  }
}

export async function listTemplateCommentsBySlug(options: {
  templateSlug: string;
  parentId?: string;
  cursor?: string;
  limit?: number;
  viewerContext: CommentViewerContext | null;
  viewer: CommentViewerPermissions;
}): Promise<TemplateCommentConnection> {
  const templateTarget = await requirePublishedTemplateForComments(options.templateSlug);
  const normalizedLimit = normalizeLimit(options.limit);

  if (options.parentId) {
    await requireTemplateParentComment({
      templateId: templateTarget.id,
      parentId: options.parentId,
    });
  }

  const conditions = [eq(templateComment.templateId, templateTarget.id)];

  if (options.parentId) {
    conditions.push(eq(templateComment.parentCommentId, options.parentId));
  } else {
    conditions.push(isNull(templateComment.parentCommentId));
  }

  if (options.cursor) {
    const parsedCursor = decodeCursor(options.cursor);
    const cursorDate = new Date(parsedCursor.createdAt);

    conditions.push(
      or(
        lt(templateComment.createdAt, cursorDate),
        and(
          eq(templateComment.createdAt, cursorDate),
          lt(templateComment.id, parsedCursor.id),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      id: templateComment.id,
      templateId: templateComment.templateId,
      userId: templateComment.userId,
      parentCommentId: templateComment.parentCommentId,
      depth: templateComment.depth,
      body: templateComment.body,
      deletedAt: templateComment.deletedAt,
      createdAt: templateComment.createdAt,
      updatedAt: templateComment.updatedAt,
      authorId: user.id,
      authorUsername: user.username,
      authorName: user.name,
      authorAvatar: user.image,
      authorXAccountId: user.xAccountId,
      authorStripeVerified: user.stripeVerified,
    })
    .from(templateComment)
    .innerJoin(user, eq(templateComment.userId, user.id))
    .where(and(...conditions)!)
    .orderBy(desc(templateComment.createdAt), desc(templateComment.id))
    .limit(normalizedLimit + 1);

  const hasMore = rows.length > normalizedLimit;
  const pageRows = hasMore ? rows.slice(0, normalizedLimit) : rows;
  const rowIds = pageRows.map((row) => row.id);

  let replyCountByParent = new Map<string, number>();

  if (rowIds.length > 0) {
    const countRows = await db
      .select({
        parentCommentId: templateComment.parentCommentId,
        total: count(templateComment.id),
      })
      .from(templateComment)
      .where(
        and(
          eq(templateComment.templateId, templateTarget.id),
          inArray(templateComment.parentCommentId, rowIds),
        ),
      )
      .groupBy(templateComment.parentCommentId);

    replyCountByParent = new Map(
      countRows
        .filter((row) => typeof row.parentCommentId === "string")
        .map((row) => [row.parentCommentId as string, Number(row.total)]),
    );
  }

  const items = pageRows.map((row) =>
    mapCommentRow({
      row,
      replyCount: replyCountByParent.get(row.id) ?? 0,
      viewerContext: options.viewerContext,
      viewer: options.viewer,
    }),
  );

  const lastRow = pageRows[pageRows.length - 1];

  return {
    items,
    nextCursor: hasMore && lastRow ? encodeCursor(lastRow) : null,
    hasMore,
    parentId: options.parentId ?? null,
    viewer: options.viewer,
  };
}

export async function getTemplateCommentById(options: {
  templateId: string;
  commentId: string;
  viewerContext: CommentViewerContext | null;
  viewer: CommentViewerPermissions;
}): Promise<TemplateComment | null> {
  const [row] = await db
    .select({
      id: templateComment.id,
      templateId: templateComment.templateId,
      userId: templateComment.userId,
      parentCommentId: templateComment.parentCommentId,
      depth: templateComment.depth,
      body: templateComment.body,
      deletedAt: templateComment.deletedAt,
      createdAt: templateComment.createdAt,
      updatedAt: templateComment.updatedAt,
      authorId: user.id,
      authorUsername: user.username,
      authorName: user.name,
      authorAvatar: user.image,
      authorXAccountId: user.xAccountId,
      authorStripeVerified: user.stripeVerified,
    })
    .from(templateComment)
    .innerJoin(user, eq(templateComment.userId, user.id))
    .where(
      and(
        eq(templateComment.id, options.commentId),
        eq(templateComment.templateId, options.templateId),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [replyCountRow] = await db
    .select({
      total: count(templateComment.id),
    })
    .from(templateComment)
    .where(eq(templateComment.parentCommentId, row.id));

  return mapCommentRow({
    row,
    replyCount: Number(replyCountRow?.total ?? 0),
    viewerContext: options.viewerContext,
    viewer: options.viewer,
  });
}
