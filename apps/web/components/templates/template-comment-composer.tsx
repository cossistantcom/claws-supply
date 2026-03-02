"use client";

import { useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TemplateCommentComposerProps = {
  onSubmit: (body: string) => Promise<void>;
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
  isPending?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
};

export function TemplateCommentComposer({
  onSubmit,
  placeholder,
  submitLabel,
  disabled = false,
  isPending = false,
  autoFocus = false,
  compact = false,
}: TemplateCommentComposerProps) {
  const [body, setBody] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = body.trim();
    if (!trimmed || disabled || isPending) {
      return;
    }

    await onSubmit(trimmed);
    setBody("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        maxLength={2_000}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        disabled={disabled || isPending}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="ghost"
          size="xs"
          disabled={disabled || isPending || body.trim().length === 0}
        >
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              Posting...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
