import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { template, user } from "@/lib/db/schema";
import { TemplateServiceError } from "./errors";

export const templateRecordSelect = {
  id: template.id,
  sellerId: template.sellerId,
  slug: template.slug,
  title: template.title,
  description: template.description,
  priceCents: template.priceCents,
  currency: template.currency,
  category: template.category,
  zipObjectKey: template.zipObjectKey,
  fileSizeBytes: template.fileSizeBytes,
  coverImageUrl: template.coverImageUrl,
  version: template.version,
  versionNotes: template.versionNotes,
  publisherHash: template.publisherHash,
  archiveHash: template.archiveHash,
  status: template.status,
  publishedAt: template.publishedAt,
  unpublishedAt: template.unpublishedAt,
  deletedAt: template.deletedAt,
  isFlagged: template.isFlagged,
  flagReason: template.flagReason,
  downloadCount: template.downloadCount,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
  sellerStripeVerified: user.stripeVerified,
};

export type TemplateRecord = {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  category: string;
  zipObjectKey: string | null;
  fileSizeBytes: number | null;
  coverImageUrl: string | null;
  version: number | null;
  versionNotes: string | null;
  publisherHash: string | null;
  archiveHash: string | null;
  status: "draft" | "published" | "unpublished" | "deleted";
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  deletedAt: Date | null;
  isFlagged: boolean;
  flagReason: string | null;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  sellerStripeVerified: boolean;
};

export type TemplateDTO = {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  category: string;
  zipObjectKey: string | null;
  fileSizeBytes: number | null;
  coverImageUrl: string | null;
  version: number | null;
  versionNotes: string | null;
  publisherHash: string | null;
  archiveHash: string | null;
  status: "draft" | "published" | "unpublished" | "deleted";
  publishedAt: string | null;
  unpublishedAt: string | null;
  deletedAt: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
};

export function mapTemplateDTO(row: TemplateRecord): TemplateDTO {
  return {
    id: row.id,
    sellerId: row.sellerId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    category: row.category,
    zipObjectKey: row.zipObjectKey,
    fileSizeBytes: row.fileSizeBytes,
    coverImageUrl: row.coverImageUrl,
    version: row.version,
    versionNotes: row.versionNotes,
    publisherHash: row.publisherHash,
    archiveHash: row.archiveHash,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    unpublishedAt: row.unpublishedAt ? row.unpublishedAt.toISOString() : null,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    isFlagged: row.isFlagged,
    flagReason: row.flagReason,
    downloadCount: row.downloadCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getTemplateRecordBySlug(
  slug: string,
): Promise<TemplateRecord | null> {
  const [record] = await db
    .select(templateRecordSelect)
    .from(template)
    .innerJoin(user, eq(template.sellerId, user.id))
    .where(eq(template.slug, slug))
    .limit(1);

  return record ?? null;
}

export async function requireTemplateRecordBySlug(slug: string): Promise<TemplateRecord> {
  const record = await getTemplateRecordBySlug(slug);

  if (!record) {
    throw new TemplateServiceError("Template not found.", {
      code: "TEMPLATE_NOT_FOUND",
      status: 404,
    });
  }

  return record;
}

export async function requireTemplateRecordById(id: string): Promise<TemplateRecord> {
  const [record] = await db
    .select(templateRecordSelect)
    .from(template)
    .innerJoin(user, eq(template.sellerId, user.id))
    .where(eq(template.id, id))
    .limit(1);

  if (!record) {
    throw new TemplateServiceError("Template not found.", {
      code: "TEMPLATE_NOT_FOUND",
      status: 404,
    });
  }

  return record;
}
