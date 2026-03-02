import { z } from "zod";
import { parseWithSchema } from "@/lib/api/validation";

const commentIdSchema = z.string().uuid("Invalid comment id.");

const cursorSchema = z
  .string()
  .trim()
  .min(1, "Invalid cursor.")
  .max(200, "Invalid cursor.");

const limitSchema = z.coerce.number().int().min(1).max(40).default(20);

export const listTemplateCommentsQuerySchema = z.object({
  parentId: commentIdSchema.optional(),
  cursor: cursorSchema.optional(),
  limit: limitSchema,
});

export const createTemplateCommentSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(1, "Comment body is required.")
      .max(2_000, "Comment body must be 2,000 characters or less."),
    parentId: commentIdSchema.optional(),
  })
  .strict();

export const commentIdParamSchema = z.object({
  commentId: commentIdSchema,
});

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseTemplateCommentsQueryFromRequest(request: Request) {
  const url = new URL(request.url);

  return parseWithSchema(listTemplateCommentsQuerySchema, {
    parentId: getFirstValue(url.searchParams.get("parentId") ?? undefined),
    cursor: getFirstValue(url.searchParams.get("cursor") ?? undefined),
    limit: getFirstValue(url.searchParams.get("limit") ?? undefined),
  });
}

export type ListTemplateCommentsQueryInput = z.infer<
  typeof listTemplateCommentsQuerySchema
>;
export type CreateTemplateCommentInput = z.infer<
  typeof createTemplateCommentSchema
>;
