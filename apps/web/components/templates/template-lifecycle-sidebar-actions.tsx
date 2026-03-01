"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { discoveryPath } from "@/lib/routes";
import {
  deleteTemplate,
  publishTemplate,
  unpublishTemplate,
} from "@/lib/templates/client/api";

type TemplateLifecycleStatus = "draft" | "published" | "unpublished" | "deleted";

type TemplateLifecycleSidebarActionsProps = {
  templateSlug: string;
  templateStatus: TemplateLifecycleStatus;
  editHref: string;
};

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export function TemplateLifecycleSidebarActions({
  templateSlug,
  templateStatus,
  editHref,
}: TemplateLifecycleSidebarActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(templateStatus);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setStatus(templateStatus);
  }, [templateStatus]);

  async function handlePublish() {
    if (status === "deleted") {
      return;
    }

    setIsPublishing(true);
    try {
      const published = await publishTemplate(templateSlug);
      setStatus(published.template.status);
      toast.success("Template published.");
      router.refresh();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to publish template."));
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleUnpublish() {
    if (status !== "published") {
      return;
    }

    setIsUnpublishing(true);
    try {
      const result = await unpublishTemplate(templateSlug);
      setStatus(result.status);
      toast.success("Template unpublished.");
      router.refresh();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to unpublish template."));
    } finally {
      setIsUnpublishing(false);
    }
  }

  async function handleDelete() {
    if (status === "deleted") {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this template? This marks it as deleted and blocks further lifecycle edits.",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTemplate(templateSlug);
      toast.success("Template deleted.");
      router.push(discoveryPath("latest"));
      router.refresh();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to delete template."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Link
        href={`${editHref}#template-editor`}
        className={buttonVariants({
          variant: "outline",
          className: "w-full justify-start",
        })}
      >
        Edit template
      </Link>

      {status !== "published" ? (
        <Button
          type="button"
          className="w-full justify-start"
          onClick={handlePublish}
          disabled={isPublishing || status === "deleted"}
        >
          {isPublishing ? (
            <>
              <Loader2Icon className="animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish"
          )}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={handleUnpublish}
          disabled={isUnpublishing}
        >
          {isUnpublishing ? (
            <>
              <Loader2Icon className="animate-spin" />
              Unpublishing...
            </>
          ) : (
            "Unpublish"
          )}
        </Button>
      )}

      <Button
        type="button"
        variant="destructive"
        className="w-full justify-start"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <Loader2Icon className="animate-spin" />
            Deleting...
          </>
        ) : (
          "Delete"
        )}
      </Button>
    </div>
  );
}
