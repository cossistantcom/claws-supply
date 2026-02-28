import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth/permissions";
import { CATEGORIES } from "@/lib/categories";
import { db } from "@/lib/db";
import { purchase, template, templateVersion, user } from "@/lib/db/schema";
import { TemplateServiceError } from "./errors";
import { normalizeTemplateDescription } from "./markdown";
import {
  mapTemplateDTO,
  requireTemplateRecordById,
  requireTemplateRecordBySlug,
  type TemplateDTO,
    type TemplateRecord,
} from "./repository";
import type {
  BlobUploadReferenceInput,
  CreateTemplateInput,
  PublishTemplateInput,
  PublishTemplateVersionInput,
  UpdateTemplateInput,
} from "./schemas";
import {
  getPrivateTemplateStream,
  verifyBlobExistsAndMetadata,
  type BlobMetadata,
} from "./blob";

export type Actor = {
  id: string;
  role?: string | null;
};

type TemplateVersionDTO = {
  id: string;
  templateId: string;
  version: number;
  zipObjectKey: string;
  fileSizeBytes: number;
  releaseNotes: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type TemplatePublishResult = {
  template: TemplateDTO;
  version: TemplateVersionDTO;
};

export type TemplateDownloadResult = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  fileName: string;
  size: number | null;
};

const DEFAULT_CLI_TEMPLATE_SHORT_DESCRIPTION =
  "Draft created via the claws-supply CLI. Update details before publishing.";
const DEFAULT_CLI_TEMPLATE_DESCRIPTION =
  "This draft was created via the claws-supply CLI publish flow. Add your full template description, category context, and pricing details before publishing.";

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    constraint?: string;
    cause?: {
      code?: string;
      constraint?: string;
    };
  };

  if (candidate.code === "23505" && candidate.constraint === constraintName) {
    return true;
  }

  return (
    candidate.cause?.code === "23505" &&
    candidate.cause?.constraint === constraintName
  );
}

async function getUserStripeVerification(userId: string): Promise<boolean> {
  const [record] = await db
    .select({
      stripeVerified: user.stripeVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!record) {
    throw new TemplateServiceError("User not found.", {
      code: "USER_NOT_FOUND",
      status: 404,
    });
  }

  return record.stripeVerified;
}

function assertPaidPriceAllowed(priceCents: number, sellerStripeVerified: boolean) {
  if (priceCents > 0 && !sellerStripeVerified) {
    throw new TemplateServiceError(
      "Paid templates require a Stripe-verified seller account.",
      {
        code: "STRIPE_VERIFICATION_REQUIRED",
        status: 403,
      },
    );
  }
}

function mapTemplateVersionDTO(row: {
  id: string;
  templateId: string;
  version: number;
  zipObjectKey: string;
  fileSizeBytes: number;
  releaseNotes: string | null;
  createdByUserId: string;
  createdAt: Date;
}): TemplateVersionDTO {
  return {
    id: row.id,
    templateId: row.templateId,
    version: row.version,
    zipObjectKey: row.zipObjectKey,
    fileSizeBytes: row.fileSizeBytes,
    releaseNotes: row.releaseNotes,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

function assertSequentialVersion(
  nextVersion: number,
  currentVersion: number | null,
  options?: { requireCurrent?: boolean },
) {
  if (options?.requireCurrent && !currentVersion) {
    throw new TemplateServiceError("Current template version is missing.", {
      code: "VERSION_INVALID",
      status: 400,
    });
  }

  if (currentVersion === null) {
    if (nextVersion !== 1) {
      throw new TemplateServiceError("Initial template version must be 1.", {
        code: "VERSION_INVALID",
        status: 400,
      });
    }

    return;
  }

  if (nextVersion !== currentVersion + 1) {
    throw new TemplateServiceError(
      "Version must increment by exactly 1 from the current template version.",
      {
        code: "VERSION_INVALID",
        status: 400,
      },
    );
  }
}

async function resolveCoverUploadMetadata(
  templateRow: TemplateRecord,
  coverUpload: BlobUploadReferenceInput | undefined,
): Promise<BlobMetadata | null> {
  if (!coverUpload) {
    return null;
  }

  return verifyBlobExistsAndMetadata({
    assetType: "cover",
    pathname: coverUpload.pathname,
    templateOwner: {
      sellerId: templateRow.sellerId,
      slug: templateRow.slug,
    },
  });
}

async function resolveZipUploadMetadata(
  templateRow: TemplateRecord,
  zipUpload: BlobUploadReferenceInput,
  version: number,
): Promise<BlobMetadata> {
  return verifyBlobExistsAndMetadata({
    assetType: "zip",
    pathname: zipUpload.pathname,
    templateOwner: {
      sellerId: templateRow.sellerId,
      slug: templateRow.slug,
    },
    version,
  });
}

export async function requireTemplateBySlug(slug: string): Promise<TemplateRecord> {
  return requireTemplateRecordBySlug(slug);
}

export function assertCanManageTemplate(actor: Actor, templateRow: TemplateRecord) {
  if (!isAdmin(actor) && actor.id !== templateRow.sellerId) {
    throw new TemplateServiceError("Forbidden.", {
      code: "FORBIDDEN",
      status: 403,
    });
  }
}

export function assertTemplateNotDeleted(templateRow: TemplateRecord) {
  if (templateRow.status === "deleted") {
    throw new TemplateServiceError("Template has been deleted.", {
      code: "TEMPLATE_DELETED",
      status: 400,
    });
  }
}

export async function createTemplateDraft(
  actor: Actor,
  input: CreateTemplateInput,
): Promise<TemplateDTO> {
  const sellerStripeVerified = await getUserStripeVerification(actor.id);
  const priceCents = input.priceCents ?? 0;
  assertPaidPriceAllowed(priceCents, sellerStripeVerified);

  const now = new Date();

  try {
    const [created] = await db
      .insert(template)
      .values({
        id: randomUUID(),
        sellerId: actor.id,
        slug: input.slug,
        title: input.title,
        description: normalizeTemplateDescription(input.description),
        shortDescription: input.shortDescription,
        priceCents,
        currency: "USD",
        category: input.category,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: template.id,
      });

    if (!created) {
      throw new TemplateServiceError("Template could not be created.", {
        code: "TEMPLATE_CREATE_FAILED",
        status: 500,
      });
    }

    const nextTemplate = await requireTemplateRecordById(created.id);
    return mapTemplateDTO(nextTemplate);
  } catch (error) {
    if (isUniqueViolation(error, "template_slug_unique")) {
      throw new TemplateServiceError("Template slug is already in use.", {
        code: "SLUG_ALREADY_EXISTS",
        status: 409,
      });
    }

    throw error;
  }
}

export async function createCliTemplateDraft(options: {
  actor: Actor;
  title: string;
  slug: string;
  zipObjectKey: string;
  fileSizeBytes: number;
  publisherHash: string;
  archiveHash: string;
}): Promise<TemplateDTO> {
  const now = new Date();
  const defaultCategory = CATEGORIES[0]?.slug ?? "marketing-seo";

  try {
    const [created] = await db
      .insert(template)
      .values({
        id: randomUUID(),
        sellerId: options.actor.id,
        slug: options.slug,
        title: options.title,
        description: normalizeTemplateDescription(DEFAULT_CLI_TEMPLATE_DESCRIPTION),
        shortDescription: DEFAULT_CLI_TEMPLATE_SHORT_DESCRIPTION,
        priceCents: 0,
        currency: "USD",
        category: defaultCategory,
        zipObjectKey: options.zipObjectKey,
        fileSizeBytes: options.fileSizeBytes,
        version: 1,
        versionNotes:
          "Initial artifact uploaded via the claws-supply CLI. Update release notes before publish.",
        publisherHash: options.publisherHash,
        archiveHash: options.archiveHash,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: template.id,
      });

    if (!created) {
      throw new TemplateServiceError("Template could not be created.", {
        code: "TEMPLATE_CREATE_FAILED",
        status: 500,
      });
    }

    const nextTemplate = await requireTemplateRecordById(created.id);
    return mapTemplateDTO(nextTemplate);
  } catch (error) {
    if (isUniqueViolation(error, "template_slug_unique")) {
      throw new TemplateServiceError("Template slug is already in use.", {
        code: "SLUG_ALREADY_EXISTS",
        status: 409,
      });
    }

    throw error;
  }
}

export async function updateTemplateMetadata(
  templateRow: TemplateRecord,
  input: UpdateTemplateInput,
): Promise<TemplateDTO> {
  assertTemplateNotDeleted(templateRow);

  const nextPriceCents = input.priceCents ?? templateRow.priceCents;
  assertPaidPriceAllowed(nextPriceCents, templateRow.sellerStripeVerified);

  const coverMetadata = await resolveCoverUploadMetadata(templateRow, input.coverUpload);
  const now = new Date();

  const [updated] = await db
    .update(template)
    .set({
      title: input.title ?? templateRow.title,
      shortDescription: input.shortDescription ?? templateRow.shortDescription,
      description:
        input.description !== undefined
          ? normalizeTemplateDescription(input.description)
          : templateRow.description,
      category: input.category ?? templateRow.category,
      priceCents: nextPriceCents,
      currency: "USD",
      coverImageUrl: coverMetadata ? coverMetadata.url : templateRow.coverImageUrl,
      versionNotes:
        input.versionNotes !== undefined
          ? input.versionNotes
          : templateRow.versionNotes,
      updatedAt: now,
    })
    .where(eq(template.id, templateRow.id))
    .returning({
      id: template.id,
    });

  if (!updated) {
    throw new TemplateServiceError("Unable to update template.", {
      code: "TEMPLATE_UPDATE_FAILED",
      status: 500,
    });
  }

  const nextTemplate = await requireTemplateRecordById(updated.id);
  return mapTemplateDTO(nextTemplate);
}

export async function publishTemplate(
  actor: Actor,
  templateRow: TemplateRecord,
  input: PublishTemplateInput,
): Promise<TemplatePublishResult> {
  assertTemplateNotDeleted(templateRow);

  if (templateRow.status === "published") {
    throw new TemplateServiceError(
      "Template is already published. Use the version publish route.",
      {
        code: "TEMPLATE_ALREADY_PUBLISHED",
        status: 400,
      },
    );
  }

  assertPaidPriceAllowed(templateRow.priceCents, templateRow.sellerStripeVerified);

  const coverMetadata = await resolveCoverUploadMetadata(templateRow, input.coverUpload);

  const nextVersion = templateRow.version;
  const nextZipObjectKey = templateRow.zipObjectKey;
  const nextFileSizeBytes = templateRow.fileSizeBytes;

  if (nextVersion === null || !nextZipObjectKey || nextFileSizeBytes === null) {
    throw new TemplateServiceError(
      "Template must have an uploaded zip file before it can be published.",
      {
        code: "TEMPLATE_FILE_NOT_FOUND",
        status: 400,
      },
    );
  }

  const nextVersionNotes =
    input.versionNotes !== undefined
      ? input.versionNotes
      : templateRow.versionNotes;
  const now = new Date();

  try {
    const result = await db.transaction(async (tx) => {
      const versionSelect = {
        id: templateVersion.id,
        templateId: templateVersion.templateId,
        version: templateVersion.version,
        zipObjectKey: templateVersion.zipObjectKey,
        fileSizeBytes: templateVersion.fileSizeBytes,
        releaseNotes: templateVersion.releaseNotes,
        createdByUserId: templateVersion.createdByUserId,
        createdAt: templateVersion.createdAt,
      } as const;

      const [existingVersion] = await tx
        .select(versionSelect)
        .from(templateVersion)
        .where(
          and(
            eq(templateVersion.templateId, templateRow.id),
            eq(templateVersion.version, nextVersion),
          ),
        )
        .limit(1);

      let persistedVersion = existingVersion;

      if (!persistedVersion) {
        const [createdVersion] = await tx
          .insert(templateVersion)
          .values({
            id: randomUUID(),
            templateId: templateRow.id,
            version: nextVersion,
            zipObjectKey: nextZipObjectKey,
            fileSizeBytes: nextFileSizeBytes,
            releaseNotes: nextVersionNotes,
            createdByUserId: actor.id,
            createdAt: now,
          })
          .returning(versionSelect);

        persistedVersion = createdVersion ?? null;
      } else if (input.versionNotes !== undefined) {
        const [updatedVersion] = await tx
          .update(templateVersion)
          .set({
            releaseNotes: input.versionNotes,
          })
          .where(eq(templateVersion.id, persistedVersion.id))
          .returning(versionSelect);

        persistedVersion = updatedVersion ?? persistedVersion;
      }

      const [updatedTemplate] = await tx
        .update(template)
        .set({
          status: "published",
          version: nextVersion,
          zipObjectKey: nextZipObjectKey,
          fileSizeBytes: nextFileSizeBytes,
          versionNotes: nextVersionNotes,
          publishedAt: now,
          unpublishedAt: null,
          ...(coverMetadata ? { coverImageUrl: coverMetadata.url } : {}),
          updatedAt: now,
        })
        .where(eq(template.id, templateRow.id))
        .returning({
          id: template.id,
        });

      if (!persistedVersion || !updatedTemplate) {
        throw new TemplateServiceError("Unable to publish template.", {
          code: "TEMPLATE_PUBLISH_FAILED",
          status: 500,
        });
      }

      return {
        createdVersion: persistedVersion,
        updatedTemplateId: updatedTemplate.id,
      };
    });

    const updatedTemplate = await requireTemplateRecordById(result.updatedTemplateId);
    return {
      template: mapTemplateDTO(updatedTemplate),
      version: mapTemplateVersionDTO(result.createdVersion),
    };
  } catch (error) {
    if (isUniqueViolation(error, "template_version_template_version_unique")) {
      throw new TemplateServiceError("Template version already exists.", {
        code: "VERSION_ALREADY_EXISTS",
        status: 409,
      });
    }

    throw error;
  }
}

export async function publishTemplateVersion(
  actor: Actor,
  templateRow: TemplateRecord,
  input: PublishTemplateVersionInput,
): Promise<TemplatePublishResult> {
  assertTemplateNotDeleted(templateRow);

  if (templateRow.status !== "published") {
    throw new TemplateServiceError(
      "Template must be published before publishing a new version.",
      {
        code: "LIFECYCLE_INVALID",
        status: 400,
      },
    );
  }

  assertSequentialVersion(input.version, templateRow.version, {
    requireCurrent: true,
  });

  const zipMetadata = await resolveZipUploadMetadata(
    templateRow,
    input.zipUpload,
    input.version,
  );
  const now = new Date();

  try {
    const result = await db.transaction(async (tx) => {
      const [createdVersion] = await tx
        .insert(templateVersion)
        .values({
          id: randomUUID(),
          templateId: templateRow.id,
          version: input.version,
          zipObjectKey: zipMetadata.pathname,
          fileSizeBytes: zipMetadata.size,
          releaseNotes: input.versionNotes ?? null,
          createdByUserId: actor.id,
          createdAt: now,
        })
        .returning({
          id: templateVersion.id,
          templateId: templateVersion.templateId,
          version: templateVersion.version,
          zipObjectKey: templateVersion.zipObjectKey,
          fileSizeBytes: templateVersion.fileSizeBytes,
          releaseNotes: templateVersion.releaseNotes,
          createdByUserId: templateVersion.createdByUserId,
          createdAt: templateVersion.createdAt,
        });

      const [updatedTemplate] = await tx
        .update(template)
        .set({
          version: input.version,
          zipObjectKey: zipMetadata.pathname,
          fileSizeBytes: zipMetadata.size,
          versionNotes: input.versionNotes ?? null,
          updatedAt: now,
        })
        .where(eq(template.id, templateRow.id))
        .returning({
          id: template.id,
        });

      if (!createdVersion || !updatedTemplate) {
        throw new TemplateServiceError("Unable to publish template version.", {
          code: "TEMPLATE_VERSION_PUBLISH_FAILED",
          status: 500,
        });
      }

      return {
        createdVersion,
        updatedTemplateId: updatedTemplate.id,
      };
    });

    const updatedTemplate = await requireTemplateRecordById(result.updatedTemplateId);
    return {
      template: mapTemplateDTO(updatedTemplate),
      version: mapTemplateVersionDTO(result.createdVersion),
    };
  } catch (error) {
    if (isUniqueViolation(error, "template_version_template_version_unique")) {
      throw new TemplateServiceError("Template version already exists.", {
        code: "VERSION_ALREADY_EXISTS",
        status: 409,
      });
    }

    throw error;
  }
}

export async function unpublishTemplate(templateRow: TemplateRecord): Promise<TemplateDTO> {
  assertTemplateNotDeleted(templateRow);

  if (templateRow.status !== "published") {
    throw new TemplateServiceError("Template is not currently published.", {
      code: "LIFECYCLE_INVALID",
      status: 400,
    });
  }

  const now = new Date();
  const [updated] = await db
    .update(template)
    .set({
      status: "unpublished",
      unpublishedAt: now,
      updatedAt: now,
    })
    .where(and(eq(template.id, templateRow.id), eq(template.status, "published")))
    .returning({
      id: template.id,
    });

  if (!updated) {
    throw new TemplateServiceError("Unable to unpublish template.", {
      code: "TEMPLATE_UNPUBLISH_FAILED",
      status: 500,
    });
  }

  const updatedTemplate = await requireTemplateRecordById(updated.id);
  return mapTemplateDTO(updatedTemplate);
}

export async function softDeleteTemplate(templateRow: TemplateRecord): Promise<void> {
  if (templateRow.status === "deleted") {
    return;
  }

  const now = new Date();
  await db
    .update(template)
    .set({
      status: "deleted",
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(template.id, templateRow.id));
}

export async function listTemplateVersions(templateId: string): Promise<TemplateVersionDTO[]> {
  const rows = await db
    .select({
      id: templateVersion.id,
      templateId: templateVersion.templateId,
      version: templateVersion.version,
      zipObjectKey: templateVersion.zipObjectKey,
      fileSizeBytes: templateVersion.fileSizeBytes,
      releaseNotes: templateVersion.releaseNotes,
      createdByUserId: templateVersion.createdByUserId,
      createdAt: templateVersion.createdAt,
    })
    .from(templateVersion)
    .where(eq(templateVersion.templateId, templateId))
    .orderBy(desc(templateVersion.version), desc(templateVersion.createdAt));

  return rows.map(mapTemplateVersionDTO);
}

async function canActorDownloadTemplate(actor: Actor, templateRow: TemplateRecord) {
  if (isAdmin(actor) || actor.id === templateRow.sellerId) {
    return true;
  }

  if (templateRow.priceCents === 0) {
    return true;
  }

  const [ownedPurchase] = await db
    .select({
      id: purchase.id,
    })
    .from(purchase)
    .where(
      and(
        eq(purchase.buyerId, actor.id),
        eq(purchase.templateId, templateRow.id),
        eq(purchase.status, "completed"),
      ),
    )
    .limit(1);

  return Boolean(ownedPurchase);
}

export async function getTemplateDownloadForActor(
  actor: Actor,
  slug: string,
): Promise<TemplateDownloadResult> {
  const templateRow = await requireTemplateRecordBySlug(slug);

  if (templateRow.status !== "published") {
    throw new TemplateServiceError("Template is not available for download.", {
      code: "TEMPLATE_UNAVAILABLE",
      status: 404,
    });
  }

  assertTemplateNotDeleted(templateRow);

  if (!templateRow.zipObjectKey) {
    throw new TemplateServiceError("Template file is missing.", {
      code: "TEMPLATE_FILE_NOT_FOUND",
      status: 404,
    });
  }

  const hasAccess = await canActorDownloadTemplate(actor, templateRow);
  if (!hasAccess) {
    throw new TemplateServiceError("You do not have access to this template.", {
      code: "FORBIDDEN",
      status: 403,
    });
  }

  const blobResult = await getPrivateTemplateStream(templateRow.zipObjectKey);

  await db.transaction(async (tx) => {
    const [lockedTemplate] = await tx
      .select({
        id: template.id,
        downloadCount: template.downloadCount,
      })
      .from(template)
      .where(eq(template.id, templateRow.id))
      .limit(1)
      .for("update");

    if (!lockedTemplate) {
      throw new TemplateServiceError("Template not found.", {
        code: "TEMPLATE_NOT_FOUND",
        status: 404,
      });
    }

    await tx
      .update(template)
      .set({
        downloadCount: lockedTemplate.downloadCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(template.id, templateRow.id));
  });

  return {
    stream: blobResult.stream,
    contentType: blobResult.blob.contentType ?? "application/zip",
    fileName: `${templateRow.slug}-v${templateRow.version ?? "latest"}.zip`,
    size: blobResult.blob.size,
  };
}
