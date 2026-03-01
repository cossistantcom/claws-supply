import "server-only";

import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import { CATEGORIES, isCategorySlug, type CategorySlug } from "@/lib/categories";
import { db } from "@/lib/db";
import { review, template, user } from "@/lib/db/schema";
import { isUserVerified } from "@/lib/profile/verification";
import { TemplateServiceError } from "./errors";
import { deriveTemplateExcerptFromMarkdown } from "./form-helpers";
import type {
  PublicTemplateCard,
  PublicTemplateDetail,
  PublicTemplateSeller,
  SellerTemplateListQueryInput,
  TemplateListQueryInput,
  TemplateListResult,
  TemplateListSort,
  TemplateMenuCounts,
  SitemapTemplateEntry,
} from "./public-types";

const READ_CACHE_REVALIDATE_SECONDS = 120;

type TemplateReadRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  coverImageUrl: string | null;
  version: number | null;
  versionNotes: string | null;
  fileSizeBytes: number | null;
  publishedAt: Date | null;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  sellerId: string;
  sellerUsername: string;
  sellerName: string;
  sellerImage: string | null;
  sellerStripeVerified: boolean;
  sellerXAccountId: string | null;
  averageRating: string | null;
  reviewCount: number | null;
};

function getReviewAggregateSubquery() {
  return db
    .select({
      templateId: review.templateId,
      averageRating: avg(review.rating).as("average_rating"),
      reviewCount: count(review.id).as("review_count"),
    })
    .from(review)
    .groupBy(review.templateId)
    .as("review_aggregate");
}

function basePublishedVisibilityConditions(): SQL<unknown>[] {
  return [
    eq(template.status, "published"),
    eq(template.isFlagged, false),
    isNull(template.deletedAt),
  ];
}

function normalizeSearchPattern(value: string) {
  return `%${value}%`;
}

function buildTemplateListWhere(input: TemplateListQueryInput): SQL<unknown> {
  const conditions = basePublishedVisibilityConditions();

  if (input.category) {
    conditions.push(eq(template.category, input.category));
  }

  if (input.freeOnly) {
    conditions.push(eq(template.priceCents, 0));
  }

  if (input.search) {
    const pattern = normalizeSearchPattern(input.search);

    conditions.push(
      or(ilike(template.title, pattern), ilike(template.description, pattern))!,
    );
  }

  return and(...conditions)!;
}

function resolveSortOrder(sort: TemplateListSort) {
  switch (sort) {
    case "popular":
      return [
        desc(template.downloadCount),
        asc(isNull(template.publishedAt)),
        desc(template.publishedAt),
        desc(template.createdAt),
      ] as const;
    case "price_asc":
      return [
        asc(template.priceCents),
        desc(template.downloadCount),
        asc(isNull(template.publishedAt)),
        desc(template.publishedAt),
      ] as const;
    case "price_desc":
      return [
        desc(template.priceCents),
        desc(template.downloadCount),
        asc(isNull(template.publishedAt)),
        desc(template.publishedAt),
      ] as const;
    case "newest":
    default:
      return [
        asc(isNull(template.publishedAt)),
        desc(template.publishedAt),
        desc(template.createdAt),
      ] as const;
  }
}

function toFiniteNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toNonNegativeInteger(value: string | number | null | undefined) {
  const numeric = Math.round(toFiniteNumber(value));
  return numeric >= 0 ? numeric : 0;
}

function mapSeller(row: TemplateReadRow): PublicTemplateSeller {
  return {
    id: row.sellerId,
    username: row.sellerUsername,
    displayName: row.sellerName,
    avatarUrl: row.sellerImage,
    isVerified: isUserVerified({
      hasVerifiedTwitterProfile: Boolean(row.sellerXAccountId),
      hasVerifiedStripeIdentity: row.sellerStripeVerified,
    }),
  };
}

function mapCategory(row: TemplateReadRow): CategorySlug {
  if (!isCategorySlug(row.category)) {
    throw new TemplateServiceError("Template category is invalid.", {
      code: "CATEGORY_INVALID",
      status: 500,
    });
  }

  return row.category;
}

function mapPublicTemplateCard(row: TemplateReadRow): PublicTemplateCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: deriveTemplateExcerptFromMarkdown(row.description),
    category: mapCategory(row),
    priceCents: row.priceCents,
    currency: row.currency,
    coverImageUrl: row.coverImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    seller: mapSeller(row),
    rating: toFiniteNumber(row.averageRating),
    reviewCount: toNonNegativeInteger(row.reviewCount),
    downloadCount: row.downloadCount,
  };
}

async function listTemplateRows(
  whereClause: SQL<unknown>,
  options: {
    limit: number;
    offset?: number;
    sort: TemplateListSort;
  },
): Promise<TemplateReadRow[]> {
  const reviewAggregate = getReviewAggregateSubquery();

  return db
    .select({
      id: template.id,
      slug: template.slug,
      title: template.title,
      description: template.description,
      category: template.category,
      priceCents: template.priceCents,
      currency: template.currency,
      coverImageUrl: template.coverImageUrl,
      version: template.version,
      versionNotes: template.versionNotes,
      fileSizeBytes: template.fileSizeBytes,
      publishedAt: template.publishedAt,
      downloadCount: template.downloadCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      sellerId: user.id,
      sellerUsername: user.username,
      sellerName: user.name,
      sellerImage: user.image,
      sellerStripeVerified: user.stripeVerified,
      sellerXAccountId: user.xAccountId,
      averageRating: reviewAggregate.averageRating,
      reviewCount: reviewAggregate.reviewCount,
    })
    .from(template)
    .innerJoin(user, eq(template.sellerId, user.id))
    .leftJoin(reviewAggregate, eq(reviewAggregate.templateId, template.id))
    .where(whereClause)
    .orderBy(...resolveSortOrder(options.sort))
    .limit(options.limit)
    .offset(options.offset ?? 0);
}

function normalizeListInput(input: TemplateListQueryInput): TemplateListQueryInput {
  return {
    category: input.category,
    sort: input.sort,
    page: input.page,
    limit: input.limit,
    freeOnly: input.freeOnly,
    search: input.search?.trim() || undefined,
  };
}

function normalizeSellerTemplateListInput(
  input: SellerTemplateListQueryInput,
): SellerTemplateListQueryInput {
  return {
    sellerId: input.sellerId?.trim() || undefined,
    sellerUsername: input.sellerUsername?.trim().toLowerCase() || undefined,
    sort: input.sort,
    page: input.page,
    limit: input.limit,
  };
}

function buildSellerTemplateListWhere(
  input: SellerTemplateListQueryInput,
): SQL<unknown> {
  const conditions = basePublishedVisibilityConditions();

  if (input.sellerId) {
    conditions.push(eq(template.sellerId, input.sellerId));
  }

  if (input.sellerUsername) {
    conditions.push(eq(user.username, input.sellerUsername));
  }

  if (!input.sellerId && !input.sellerUsername) {
    throw new TemplateServiceError(
      "Seller ID or seller username is required to list published templates.",
      {
        code: "SELLER_IDENTIFIER_REQUIRED",
        status: 400,
      },
    );
  }

  return and(...conditions)!;
}

export async function listPublishedTemplates(
  input: TemplateListQueryInput,
): Promise<TemplateListResult> {
  const normalizedInput = normalizeListInput(input);
  const whereClause = buildTemplateListWhere(normalizedInput);
  const offset = (normalizedInput.page - 1) * normalizedInput.limit;

  const [total, rows] = await Promise.all([
    db.$count(template, whereClause),
    listTemplateRows(whereClause, {
      limit: normalizedInput.limit,
      offset,
      sort: normalizedInput.sort,
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedInput.limit);

  return {
    items: rows.map(mapPublicTemplateCard),
    page: normalizedInput.page,
    limit: normalizedInput.limit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && normalizedInput.page < totalPages,
    hasPreviousPage: normalizedInput.page > 1,
  };
}

export async function listPublishedTemplatesBySeller(
  input: SellerTemplateListQueryInput,
): Promise<TemplateListResult> {
  const normalizedInput = normalizeSellerTemplateListInput(input);
  const whereClause = buildSellerTemplateListWhere(normalizedInput);
  const offset = (normalizedInput.page - 1) * normalizedInput.limit;

  const [countRows, rows] = await Promise.all([
    db
      .select({
        total: count(template.id),
      })
      .from(template)
      .innerJoin(user, eq(template.sellerId, user.id))
      .where(whereClause),
    listTemplateRows(whereClause, {
      limit: normalizedInput.limit,
      offset,
      sort: normalizedInput.sort,
    }),
  ]);

  const total = toNonNegativeInteger(countRows[0]?.total);
  const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedInput.limit);

  return {
    items: rows.map(mapPublicTemplateCard),
    page: normalizedInput.page,
    limit: normalizedInput.limit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && normalizedInput.page < totalPages,
    hasPreviousPage: normalizedInput.page > 1,
  };
}

export async function listRelatedPublishedTemplates(input: {
  templateId: string;
  category: CategorySlug;
  limit: number;
}): Promise<PublicTemplateCard[]> {
  const whereClause = and(
    ...basePublishedVisibilityConditions(),
    eq(template.category, input.category),
    ne(template.id, input.templateId),
  )!;

  const rows = await listTemplateRows(whereClause, {
    limit: input.limit,
    sort: "popular",
  });

  return rows.map(mapPublicTemplateCard);
}

export async function getPublishedTemplateBySlug(
  slug: string,
): Promise<PublicTemplateDetail | null> {
  const whereClause = and(...basePublishedVisibilityConditions(), eq(template.slug, slug))!;
  const [row] = await listTemplateRows(whereClause, {
    limit: 1,
    sort: "newest",
  });

  if (!row) {
    return null;
  }

  const category = mapCategory(row);
  const relatedTemplates = await listRelatedPublishedTemplates({
    templateId: row.id,
    category,
    limit: 6,
  });

  return {
    template: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: deriveTemplateExcerptFromMarkdown(row.description),
      description: row.description,
      category,
      priceCents: row.priceCents,
      currency: row.currency,
      coverImageUrl: row.coverImageUrl,
      version: row.version,
      versionNotes: row.versionNotes,
      fileSizeBytes: row.fileSizeBytes,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    seller: mapSeller(row),
    stats: {
      downloadCount: row.downloadCount,
      rating: toFiniteNumber(row.averageRating),
      reviewCount: toNonNegativeInteger(row.reviewCount),
    },
    relatedTemplates,
  };
}

export async function getTemplateDetailBySlugIncludingUnpublished(
  slug: string,
): Promise<PublicTemplateDetail | null> {
  const whereClause = and(
    eq(template.slug, slug),
    ne(template.status, "deleted"),
    isNull(template.deletedAt),
  )!;
  const [row] = await listTemplateRows(whereClause, {
    limit: 1,
    sort: "newest",
  });

  if (!row) {
    return null;
  }

  const category = mapCategory(row);
  const relatedTemplates = await listRelatedPublishedTemplates({
    templateId: row.id,
    category,
    limit: 6,
  });

  return {
    template: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: deriveTemplateExcerptFromMarkdown(row.description),
      description: row.description,
      category,
      priceCents: row.priceCents,
      currency: row.currency,
      coverImageUrl: row.coverImageUrl,
      version: row.version,
      versionNotes: row.versionNotes,
      fileSizeBytes: row.fileSizeBytes,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    seller: mapSeller(row),
    stats: {
      downloadCount: row.downloadCount,
      rating: toFiniteNumber(row.averageRating),
      reviewCount: toNonNegativeInteger(row.reviewCount),
    },
    relatedTemplates,
  };
}

function createEmptyCategoryCounts(): Record<CategorySlug, number> {
  return Object.fromEntries(
    CATEGORIES.map((category) => [category.slug, 0]),
  ) as Record<CategorySlug, number>;
}

export async function getTemplateCountsForMenu(): Promise<TemplateMenuCounts> {
  const whereClause = and(...basePublishedVisibilityConditions())!;

  const [total, categoryRows] = await Promise.all([
    db.$count(template, whereClause),
    db
      .select({
        category: template.category,
        count: count(template.id),
      })
      .from(template)
      .where(whereClause)
      .groupBy(template.category),
  ]);

  const categoryCounts = createEmptyCategoryCounts();

  for (const row of categoryRows) {
    if (!isCategorySlug(row.category)) {
      continue;
    }

    categoryCounts[row.category] = toNonNegativeInteger(row.count);
  }

  return {
    discovery: {
      latest: total,
      popular: total,
    },
    categories: categoryCounts,
  };
}

export async function listPublishedTemplateSlugsForSitemap(): Promise<SitemapTemplateEntry[]> {
  const whereClause = and(...basePublishedVisibilityConditions())!;

  return db
    .select({
      slug: template.slug,
      updatedAt: template.updatedAt,
    })
    .from(template)
    .where(whereClause)
    .orderBy(desc(template.updatedAt));
}

const listPublishedTemplatesCachedImpl = unstable_cache(
  async (input: TemplateListQueryInput) => listPublishedTemplates(input),
  ["templates-list-published"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const listPublishedTemplatesBySellerCachedImpl = unstable_cache(
  async (input: SellerTemplateListQueryInput) => listPublishedTemplatesBySeller(input),
  ["templates-list-published-by-seller"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const getPublishedTemplateBySlugCachedImpl = unstable_cache(
  async (slug: string) => getPublishedTemplateBySlug(slug),
  ["templates-detail-published"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const listRelatedPublishedTemplatesCachedImpl = unstable_cache(
  async (input: { templateId: string; category: CategorySlug; limit: number }) =>
    listRelatedPublishedTemplates(input),
  ["templates-related-published"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const getTemplateCountsForMenuCachedImpl = unstable_cache(
  async () => getTemplateCountsForMenu(),
  ["templates-counts-menu"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

const listPublishedTemplateSlugsForSitemapCachedImpl = unstable_cache(
  async () => listPublishedTemplateSlugsForSitemap(),
  ["templates-sitemap-published"],
  {
    revalidate: READ_CACHE_REVALIDATE_SECONDS,
  },
);

export async function listPublishedTemplatesCached(
  input: TemplateListQueryInput,
): Promise<TemplateListResult> {
  return listPublishedTemplatesCachedImpl(normalizeListInput(input));
}

export async function listPublishedTemplatesBySellerCached(
  input: SellerTemplateListQueryInput,
): Promise<TemplateListResult> {
  return listPublishedTemplatesBySellerCachedImpl(
    normalizeSellerTemplateListInput(input),
  );
}

export async function getPublishedTemplateBySlugCached(
  slug: string,
): Promise<PublicTemplateDetail | null> {
  return getPublishedTemplateBySlugCachedImpl(slug);
}

export async function listRelatedPublishedTemplatesCached(input: {
  templateId: string;
  category: CategorySlug;
  limit: number;
}): Promise<PublicTemplateCard[]> {
  return listRelatedPublishedTemplatesCachedImpl(input);
}

export async function getTemplateCountsForMenuCached(): Promise<TemplateMenuCounts> {
  return getTemplateCountsForMenuCachedImpl();
}

export async function listPublishedTemplateSlugsForSitemapCached(): Promise<
  SitemapTemplateEntry[]
> {
  return listPublishedTemplateSlugsForSitemapCachedImpl();
}
