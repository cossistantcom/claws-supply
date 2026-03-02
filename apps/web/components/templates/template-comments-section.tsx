import { getSessionFromNextHeaders } from "@/lib/auth/session";
import {
  listTemplateCommentsBySlug,
  resolveCommentViewer,
} from "@/lib/templates/comments/read-service";
import { TemplateCommentsThread } from "./template-comments-thread";

type TemplateCommentsSectionProps = {
  templateSlug: string;
};

export async function TemplateCommentsSection({
  templateSlug,
}: TemplateCommentsSectionProps) {
  let initialConnection:
    | Awaited<ReturnType<typeof listTemplateCommentsBySlug>>
    | null = null;

  try {
    const session = await getSessionFromNextHeaders();
    const { viewerContext, viewer } = await resolveCommentViewer(
      session
        ? {
            id: session.user.id,
            role: session.user.role,
          }
        : null,
    );

    initialConnection = await listTemplateCommentsBySlug({
      templateSlug,
      viewerContext,
      viewer,
    });
  } catch {
    initialConnection = null;
  }

  if (!initialConnection) {
    return (
      <section id="template-comments" className="space-y-2 border-t border-border/60 pt-8">
        <h2 className="text-lg">Discussion</h2>
        <p className="text-xs text-muted-foreground">
          Comments are temporarily unavailable.
        </p>
      </section>
    );
  }

  return (
    <TemplateCommentsThread
      templateSlug={templateSlug}
      initialConnection={initialConnection}
    />
  );
}
