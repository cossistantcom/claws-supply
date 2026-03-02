"use client";

import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type TemplateCommentActionsProps = {
  canReply: boolean;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => Promise<void>;
  deleting?: boolean;
};

export function TemplateCommentActions({
  canReply,
  canDelete,
  onReply,
  onDelete,
  deleting = false,
}: TemplateCommentActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {canReply ? (
        <Button type="button" variant="ghost" size="xs" onClick={onReply}>
          Reply
        </Button>
      ) : null}

      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Loader2Icon className="animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </Button>
      ) : null}
    </div>
  );
}
