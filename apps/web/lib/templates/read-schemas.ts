import { z } from "zod";
import { parseWithSchema } from "@/lib/api/validation";
import { isCategorySlug, type CategorySlug } from "@/lib/categories";
import type { TemplateListQueryInput } from "./public-types";

const MAX_SEARCH_LENGTH = 120;

const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(50).default(20);

const categorySchema = z
  .string()
  .trim()
  .refine((value): value is CategorySlug => isCategorySlug(value), {
    message: "Invalid category.",
  });

const boolQuerySchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return value;
}, z.boolean());

const searchSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_SEARCH_LENGTH)
  .optional();

const templateListSortInputSchema = z.enum([
  "newest",
  "latest",
  "popular",
  "price_asc",
  "price_desc",
]);

export const templateListSortSchema = templateListSortInputSchema.transform((value) =>
  value === "latest" ? "newest" : value,
);

export const templateListQuerySchema = z.object({
  category: categorySchema.optional(),
  sort: templateListSortSchema.default("newest"),
  page: pageSchema,
  limit: limitSchema,
  freeOnly: boolQuerySchema.default(false),
  search: searchSchema,
});

export type TemplateListSortInput = z.infer<typeof templateListSortInputSchema>;

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeListQueryInput(input: Record<string, unknown>) {
  const normalizedSearch =
    typeof input.search === "string" ? input.search.trim() : input.search;

  return {
    category: input.category,
    sort: input.sort,
    page: input.page,
    limit: input.limit,
    freeOnly: input.freeOnly,
    search:
      typeof normalizedSearch === "string" && normalizedSearch.length === 0
        ? undefined
        : normalizedSearch,
  };
}

export function parseTemplateListQueryFromRequest(
  request: Request,
): TemplateListQueryInput {
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());

  return parseWithSchema(templateListQuerySchema, normalizeListQueryInput(raw));
}

export function parseTemplateListQueryFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): TemplateListQueryInput {
  const raw = {
    category: getFirstValue(searchParams.category),
    sort: getFirstValue(searchParams.sort),
    page: getFirstValue(searchParams.page),
    limit: getFirstValue(searchParams.limit),
    freeOnly: getFirstValue(searchParams.freeOnly),
    search: getFirstValue(searchParams.search),
  };

  return parseWithSchema(templateListQuerySchema, normalizeListQueryInput(raw));
}
