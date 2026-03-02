"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TemplateCommissionCard } from "@/components/templates/template-commission-card";
import {
  type TemplateMetadataFormValues,
  TemplateMetadataFields,
} from "@/components/templates/template-metadata-fields";
import { CoverUploadField } from "@/components/templates/cover-upload-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  updateTemplate,
  type BlobUploadReferenceInput,
  type TemplateMutationDTO,
  type TemplateVersionDTO,
} from "@/lib/templates/client/api";

type TemplateOwnerPanelProps = {
  initialTemplate: TemplateMutationDTO;
  initialVersions: TemplateVersionDTO[];
  isAdmin: boolean;
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

function toMetadataValues(template: TemplateMutationDTO): TemplateMetadataFormValues {
  return {
    title: template.title,
    slug: template.slug,
    category: template.category as TemplateMetadataFormValues["category"],
    description: template.description,
    priceCents: template.priceCents,
  };
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function TemplateOwnerPanel({
  initialTemplate,
  initialVersions,
  isAdmin,
}: TemplateOwnerPanelProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [versions, setVersions] = useState(initialVersions);
  const [metadata, setMetadata] = useState(() => toMetadataValues(initialTemplate));
  const [currentVersionNotesDraft, setCurrentVersionNotesDraft] = useState(
    initialTemplate.versionNotes ?? "",
  );
  const [pendingCoverUpload, setPendingCoverUpload] =
    useState<BlobUploadReferenceInput | null>(null);
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  useEffect(() => {
    setTemplate(initialTemplate);
    setVersions(initialVersions);
    setMetadata(toMetadataValues(initialTemplate));
    setCurrentVersionNotesDraft(initialTemplate.versionNotes ?? "");
  }, [initialTemplate, initialVersions]);

  const canSaveEdits = template.status !== "deleted";
  const hasMetadataChanges =
    metadata.title !== template.title ||
    metadata.description !== template.description ||
    metadata.category !== template.category ||
    metadata.priceCents !== template.priceCents;

  async function handleSaveEdits() {
    if (!canSaveEdits) {
      return;
    }

    const notes = currentVersionNotesDraft.trim();
    const shouldUpdateCurrentNotes =
      notes.length >= 3 && notes !== (template.versionNotes ?? "");

    if (!hasMetadataChanges && !pendingCoverUpload && !shouldUpdateCurrentNotes) {
      toast.message("No pending changes.");
      return;
    }

    setIsSavingEdits(true);
    try {
      const updated = await updateTemplate(template.slug, {
        ...(metadata.title !== template.title ? { title: metadata.title } : {}),
        ...(metadata.description !== template.description
          ? { description: metadata.description }
          : {}),
        ...(metadata.category !== template.category
          ? { category: metadata.category }
          : {}),
        ...(metadata.priceCents !== template.priceCents
          ? { priceCents: metadata.priceCents }
          : {}),
        ...(pendingCoverUpload ? { coverUpload: pendingCoverUpload } : {}),
        ...(shouldUpdateCurrentNotes ? { versionNotes: notes } : {}),
      });

      setTemplate(updated);
      setMetadata(toMetadataValues(updated));
      setCurrentVersionNotesDraft(updated.versionNotes ?? notes);
      setPendingCoverUpload(null);
      toast.success("Template saved.");
      router.refresh();
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to save template."));
    } finally {
      setIsSavingEdits(false);
    }
  }

  return (
    <div id="template-editor" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Owner / Admin Panel</CardTitle>
          <CardDescription>
            Status: <strong>{template.status}</strong>
            {" · "}
            {isAdmin ? "Admin controls enabled." : "Owner controls enabled."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TemplateMetadataFields
            values={metadata}
            disabled={!canSaveEdits}
            slugReadOnly
            onTitleChange={(value) => {
              setMetadata((current) => ({
                ...current,
                title: value,
              }));
            }}
            onSlugChange={(value) => {
              setMetadata((current) => ({
                ...current,
                slug: value,
              }));
            }}
            onCategoryChange={(value) => {
              setMetadata((current) => ({
                ...current,
                category: value,
              }));
            }}
            onDescriptionChange={(value) => {
              setMetadata((current) => ({
                ...current,
                description: value,
              }));
            }}
            onPriceCentsChange={(value) => {
              setMetadata((current) => ({
                ...current,
                priceCents: value,
              }));
            }}
          />

          <TemplateCommissionCard priceCents={metadata.priceCents} />

          <div className="space-y-1">
            <label
              htmlFor="template-current-version-notes"
              className="text-xs uppercase tracking-wide"
            >
              What&apos;s New (Current Version)
            </label>
            <Textarea
              id="template-current-version-notes"
              value={currentVersionNotesDraft}
              onChange={(event) => setCurrentVersionNotesDraft(event.target.value)}
              rows={4}
              maxLength={2_000}
              disabled={!canSaveEdits}
            />
          </div>

          <CoverUploadField
            templateSlug={template.slug}
            sellerId={template.sellerId}
            disabled={!canSaveEdits}
            onUploaded={(result) => {
              setPendingCoverUpload({
                pathname: result.pathname,
                url: result.url,
                contentType: result.contentType,
                etag: result.etag,
              });
            }}
          />

          <div className="space-y-1 border border-border p-4 text-[11px] text-muted-foreground">
            <p className="text-xs uppercase tracking-wide text-foreground">
              Zip Version Uploads
            </p>
            <p>
              Uploading new template zip versions is now CLI-only. Use{" "}
              <code>npx claws-supply@latest build</code> and{" "}
              <code>npx claws-supply@latest publish</code> from your local project.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveEdits}
              disabled={isSavingEdits || !canSaveEdits}
            >
              {isSavingEdits ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Edits"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            Most recent first. Release notes are shown as “what&apos;s new”.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No versions published yet.</p>
          ) : (
            versions.map((version) => (
              <article key={version.id} className="border border-border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p>
                    <strong>v{version.version}</strong> ·{" "}
                    {formatFileSize(version.fileSizeBytes)}
                  </p>
                  <p className="text-muted-foreground">{formatDate(version.createdAt)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {version.releaseNotes?.trim().length
                    ? version.releaseNotes
                    : "No release notes provided."}
                </p>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
