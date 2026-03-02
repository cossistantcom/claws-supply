"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useCreateTemplateCommentMutation,
  useDeleteTemplateCommentMutation,
  useTemplateCommentsInfiniteQuery,
} from "@/lib/templates/comments/query";
import type { TemplateCommentConnection } from "@/lib/templates/comments/types";
import { TemplateCommentComposer } from "./template-comment-composer";
import { TemplateCommentItem } from "./template-comment-item";

type TemplateCommentsThreadProps = {
  templateSlug: string;
  initialConnection: TemplateCommentConnection;
};

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export function TemplateCommentsThread({
  templateSlug,
  initialConnection,
}: TemplateCommentsThreadProps) {
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const rootCommentsQuery = useTemplateCommentsInfiniteQuery({
    templateSlug,
    initialConnection,
    enabled: true,
  });
  const createCommentMutation = useCreateTemplateCommentMutation(templateSlug);
  const deleteCommentMutation = useDeleteTemplateCommentMutation(templateSlug);

  const pages = rootCommentsQuery.data?.pages ?? [initialConnection];
  const topLevelComments = pages.flatMap((page) => page.items);
  const viewer = pages[0]?.viewer ?? initialConnection.viewer;

  async function handleCreateComment(input: { body: string; parentId?: string }) {
    try {
      await createCommentMutation.mutateAsync(input);
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to post comment."));
      throw error;
    }
  }

  async function handleDeleteComment(commentId: string) {
    const shouldDelete = window.confirm("Delete this comment?");
    if (!shouldDelete) {
      return;
    }

    setDeletingCommentId(commentId);

    try {
      await deleteCommentMutation.mutateAsync({ commentId });
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to delete comment."));
    } finally {
      setDeletingCommentId(null);
    }
  }

  return (
    <section id="template-comments" className="space-y-5 border-t border-border/60 pt-8">
      <div className="space-y-1">
        <h2 className="text-lg">Discussion</h2>
        <p className="text-xs text-muted-foreground">
          Leave feedback, ask questions, and discuss how this template performs.
        </p>
      </div>

      {viewer.canPost ? (
        <TemplateCommentComposer
          onSubmit={(body) => handleCreateComment({ body })}
          placeholder="Share your thoughts about this template"
          submitLabel="Post"
          isPending={createCommentMutation.isPending}
        />
      ) : viewer.isAuthenticated ? (
        <p className="text-xs text-muted-foreground">
          Connect X or verify Stripe in your <Link href="/profile" className="underline">profile</Link> to post comments.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sign in and connect X or Stripe to join this discussion.
        </p>
      )}

      {rootCommentsQuery.isPending ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : null}

      {topLevelComments.length > 0 ? (
        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <TemplateCommentItem
              key={comment.id}
              templateSlug={templateSlug}
              comment={comment}
              onCreateComment={handleCreateComment}
              onDeleteComment={handleDeleteComment}
              isCreating={createCommentMutation.isPending}
              deletingCommentId={deletingCommentId}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No comments yet. Start the thread.
        </p>
      )}

      {rootCommentsQuery.hasNextPage ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => rootCommentsQuery.fetchNextPage()}
          disabled={rootCommentsQuery.isFetchingNextPage}
        >
          {rootCommentsQuery.isFetchingNextPage ? (
            <>
              <Loader2Icon className="animate-spin" />
              Loading...
            </>
          ) : (
            "Load more comments"
          )}
        </Button>
      ) : null}
    </section>
  );
}
