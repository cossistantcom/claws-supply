"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TemplateCommissionCard } from "@/components/templates/template-commission-card";
import {
  type TemplateMetadataFormValues,
  TemplateMetadataFields,
} from "@/components/templates/template-metadata-fields";
import { CoverUploadField } from "@/components/templates/cover-upload-field";
import { ZipUploadField } from "@/components/templates/zip-upload-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/lib/categories";
import { templatePath } from "@/lib/routes";
import {
  createTemplateDraft,
  updateTemplate,
  type BlobUploadReferenceInput,
  type TemplateMutationDTO,
} from "@/lib/templates/client/api";
import {
  deriveShortDescriptionFromMarkdown,
  slugifyTemplateTitle,
} from "@/lib/templates/form-helpers";

const INITIAL_CATEGORY = CATEGORIES[0]?.slug ?? "marketing-seo";

type TemplateCreatePageProps = {
  sellerId: string;
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

export function TemplateCreatePage({ sellerId }: TemplateCreatePageProps) {
  const [metadata, setMetadata] = useState<TemplateMetadataFormValues>({
    title: "",
    slug: "",
    category: INITIAL_CATEGORY,
    description: "",
    shortDescription: "",
    priceCents: 0,
  });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [isShortDescriptionManuallyEdited, setIsShortDescriptionManuallyEdited] =
    useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<TemplateMutationDTO | null>(
    null,
  );
  const [coverUpload, setCoverUpload] = useState<BlobUploadReferenceInput | null>(null);
  const [zipUpload, setZipUpload] = useState<BlobUploadReferenceInput | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSavingDraftAssets, setIsSavingDraftAssets] = useState(false);

  const nextVersion = useMemo(() => {
    if (!createdTemplate?.version) {
      return 1;
    }

    return createdTemplate.version + 1;
  }, [createdTemplate?.version]);

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingDraft(true);

    try {
      const created = await createTemplateDraft({
        title: metadata.title,
        slug: metadata.slug,
        category: metadata.category,
        description: metadata.description,
        shortDescription: metadata.shortDescription,
        priceCents: metadata.priceCents,
        currency: "USD",
      });

      setCreatedTemplate(created);
      toast.success("Draft created. Upload cover + zip to complete setup.");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to create draft."));
    } finally {
      setIsCreatingDraft(false);
    }
  }

  async function handleSaveDraftAssets() {
    if (!createdTemplate) {
      return;
    }

    if (!coverUpload || !zipUpload) {
      toast.error("Upload both cover image and zip before saving.");
      return;
    }

    if (versionNotes.trim().length < 3) {
      toast.error("Version notes must be at least 3 characters.");
      return;
    }

    setIsSavingDraftAssets(true);
    try {
      const updated = await updateTemplate(createdTemplate.slug, {
        coverUpload,
        zipUpload,
        version: nextVersion,
        versionNotes: versionNotes.trim(),
      });

      setCreatedTemplate(updated);
      setCoverUpload(null);
      setZipUpload(null);
      setVersionNotes(updated.versionNotes ?? "");
      toast.success("Draft assets saved.");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Unable to save draft assets."));
    } finally {
      setIsSavingDraftAssets(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
          <CardDescription>
            Step 1: create draft metadata. Step 2: upload cover + zip and add
            release notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-6" onSubmit={handleCreateDraft}>
            <TemplateMetadataFields
              values={metadata}
              disabled={isCreatingDraft || Boolean(createdTemplate)}
              onTitleChange={(value) => {
                setMetadata((current) => ({
                  ...current,
                  title: value,
                  slug: isSlugManuallyEdited ? current.slug : slugifyTemplateTitle(value),
                }));
              }}
              onSlugChange={(value) => {
                setIsSlugManuallyEdited(true);
                setMetadata((current) => ({
                  ...current,
                  slug: slugifyTemplateTitle(value),
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
                  shortDescription: isShortDescriptionManuallyEdited
                    ? current.shortDescription
                    : deriveShortDescriptionFromMarkdown(value),
                }));
              }}
              onShortDescriptionChange={(value) => {
                setIsShortDescriptionManuallyEdited(true);
                setMetadata((current) => ({
                  ...current,
                  shortDescription: value,
                }));
              }}
              onPriceCentsChange={(value) => {
                setMetadata((current) => ({
                  ...current,
                  priceCents: value,
                }));
              }}
            />

            {!createdTemplate ? (
              <div className="flex justify-end">
                <Button type="submit" disabled={isCreatingDraft}>
                  {isCreatingDraft ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Draft"
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-emerald-600">
                Draft created at{" "}
                <Link className="underline" href={templatePath(createdTemplate.slug)}>
                  {templatePath(createdTemplate.slug)}
                </Link>
              </p>
            )}
          </form>

          <TemplateCommissionCard priceCents={metadata.priceCents} />
        </CardContent>
      </Card>

      {createdTemplate ? (
        <Card>
          <CardHeader>
            <CardTitle>Complete Draft Setup</CardTitle>
            <CardDescription>
              Upload cover + zip for version {nextVersion}, then save this draft.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CoverUploadField
              templateSlug={createdTemplate.slug}
              sellerId={sellerId}
              onUploaded={(result) => {
                setCoverUpload({
                  pathname: result.pathname,
                  url: result.url,
                  contentType: result.contentType,
                  etag: result.etag,
                });
              }}
            />

            <ZipUploadField
              templateSlug={createdTemplate.slug}
              sellerId={sellerId}
              version={nextVersion}
              onUploaded={(result) => {
                setZipUpload({
                  pathname: result.pathname,
                  url: result.url,
                  contentType: result.contentType,
                  etag: result.etag,
                });
              }}
            />

            <div className="space-y-1">
              <label
                htmlFor="template-version-notes"
                className="text-xs uppercase tracking-wide"
              >
                What&apos;s New (Version {nextVersion})
              </label>
              <Textarea
                id="template-version-notes"
                value={versionNotes}
                onChange={(event) => setVersionNotes(event.target.value)}
                rows={4}
                maxLength={2_000}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraftAssets}
                disabled={isSavingDraftAssets}
              >
                {isSavingDraftAssets ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Draft Assets"
                )}
              </Button>
              <Link className="text-xs underline" href={templatePath(createdTemplate.slug)}>
                Open Template Page
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
