"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { MemberAvatar } from "@/components/members/member-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTemplateCommentsInfiniteQuery } from "@/lib/templates/comments/query";
import type { TemplateComment } from "@/lib/templates/comments/types";
import { TemplateCommentActions } from "./template-comment-actions";
import { TemplateCommentComposer } from "./template-comment-composer";

type TemplateCommentItemProps = {
  templateSlug: string;
  comment: TemplateComment;
  onCreateComment: (input: { body: string; parentId?: string }) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isCreating: boolean;
  deletingCommentId: string | null;
};

function formatCommentDate(isoDate: string) {
  return new Date(isoDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TemplateCommentItem({
  templateSlug,
  comment,
  onCreateComment,
  onDeleteComment,
  isCreating,
  deletingCommentId,
}: TemplateCommentItemProps) {
  const [isReplyComposerOpen, setIsReplyComposerOpen] = useState(false);
  const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);

  const repliesQuery = useTemplateCommentsInfiniteQuery({
    templateSlug,
    parentId: comment.id,
    enabled: isRepliesExpanded && comment.replyCount > 0,
  });

  const replies = repliesQuery.data?.pages.flatMap((page) => page.items) ?? [];

  async function handleCreateReply(body: string) {
    await onCreateComment({
      body,
      parentId: comment.id,
    });

    setIsReplyComposerOpen(false);
    setIsRepliesExpanded(true);
  }

  async function handleDeleteComment() {
    await onDeleteComment(comment.id);
  }

  return (
    <article
      className={cn(
        "space-y-2",
        comment.depth > 0
          ? "relative ml-5 pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border/35"
          : "",
      )}
    >
      <div className="flex items-start gap-2.5">
        <MemberAvatar
          name={comment.author.displayName}
          username={comment.author.username}
          image={comment.author.avatarUrl}
          className="size-8 border-0 bg-muted/60"
          fallbackClassName="text-[9px]"
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="text-foreground">{comment.author.displayName}</span>
            <span>@{comment.author.username}</span>
            <span>{formatCommentDate(comment.createdAt)}</span>
          </div>

          <p
            className={cn(
              "whitespace-pre-wrap break-words text-sm text-foreground/90",
              comment.isDeleted ? "italic text-muted-foreground" : "",
            )}
          >
            {comment.body}
          </p>

          <TemplateCommentActions
            canReply={comment.permissions.canReply}
            canDelete={comment.permissions.canDelete}
            onReply={() => setIsReplyComposerOpen((current) => !current)}
            onDelete={handleDeleteComment}
            deleting={deletingCommentId === comment.id}
          />

          {isReplyComposerOpen ? (
            <div className="pt-1">
              <TemplateCommentComposer
                onSubmit={handleCreateReply}
                placeholder="Write a reply"
                submitLabel="Reply"
                compact
                isPending={isCreating}
              />
            </div>
          ) : null}

          {comment.replyCount > 0 ? (
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setIsRepliesExpanded((current) => !current)}
              >
                {isRepliesExpanded
                  ? "Hide replies"
                  : `Show replies (${comment.replyCount})`}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {isRepliesExpanded ? (
        <div className="space-y-3 pt-1">
          {repliesQuery.isPending ? (
            <p className="text-xs text-muted-foreground">Loading replies...</p>
          ) : null}

          {replies.map((reply) => (
            <TemplateCommentItem
              key={reply.id}
              templateSlug={templateSlug}
              comment={reply}
              onCreateComment={onCreateComment}
              onDeleteComment={onDeleteComment}
              isCreating={isCreating}
              deletingCommentId={deletingCommentId}
            />
          ))}

          {repliesQuery.hasNextPage ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => repliesQuery.fetchNextPage()}
              disabled={repliesQuery.isFetchingNextPage}
            >
              {repliesQuery.isFetchingNextPage ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more replies"
              )}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
