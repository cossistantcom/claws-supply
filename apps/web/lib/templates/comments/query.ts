"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTemplateComment,
  deleteTemplateComment,
  fetchTemplateComments,
} from "./api";
import type { TemplateCommentConnection } from "./types";

export function templateCommentsQueryKey(templateSlug: string, parentId?: string) {
  return ["template-comments", templateSlug, parentId ?? "root"] as const;
}

export function useTemplateCommentsInfiniteQuery(options: {
  templateSlug: string;
  parentId?: string;
  enabled?: boolean;
  limit?: number;
  initialConnection?: TemplateCommentConnection;
}) {
  return useInfiniteQuery({
    queryKey: templateCommentsQueryKey(options.templateSlug, options.parentId),
    queryFn: ({ pageParam }) =>
      fetchTemplateComments({
        templateSlug: options.templateSlug,
        parentId: options.parentId,
        cursor: typeof pageParam === "string" ? pageParam : undefined,
        limit: options.limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: options.enabled,
    initialData: options.initialConnection
      ? {
          pages: [options.initialConnection],
          pageParams: [undefined],
        }
      : undefined,
  });
}

export function useCreateTemplateCommentMutation(templateSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      createTemplateComment({
        templateSlug,
        body: input.body,
        parentId: input.parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["template-comments", templateSlug],
      });
    },
  });
}

export function useDeleteTemplateCommentMutation(templateSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string }) =>
      deleteTemplateComment({
        templateSlug,
        commentId: input.commentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["template-comments", templateSlug],
      });
    },
  });
}
