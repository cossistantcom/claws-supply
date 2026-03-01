import type { CategorySlug } from "@/lib/categories";

export type TemplateListSort = "newest" | "popular" | "price_asc" | "price_desc";

export type TemplateListQueryInput = {
  category?: CategorySlug;
  sort: TemplateListSort;
  page: number;
  limit: number;
  freeOnly: boolean;
  search?: string;
};

export type SellerTemplateListQueryInput = {
  sellerId?: string;
  sellerUsername?: string;
  sort: TemplateListSort;
  page: number;
  limit: number;
};

export type PublicTemplateSeller = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
};

export type PublicTemplateStats = {
  downloadCount: number;
  rating: number;
  reviewCount: number;
};

export type PublicTemplateCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: CategorySlug;
  priceCents: number;
  currency: string;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  seller: PublicTemplateSeller;
  rating: number;
  reviewCount: number;
  downloadCount: number;
};

export type PublicTemplateDetailTemplate = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: CategorySlug;
  priceCents: number;
  currency: string;
  coverImageUrl: string | null;
  version: number | null;
  versionNotes: string | null;
  fileSizeBytes: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicTemplateDetail = {
  template: PublicTemplateDetailTemplate;
  seller: PublicTemplateSeller;
  stats: PublicTemplateStats;
  relatedTemplates: PublicTemplateCard[];
};

export type TemplateListResult = {
  items: PublicTemplateCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TemplateMenuCounts = {
  discovery: {
    latest: number;
    popular: number;
  };
  categories: Record<CategorySlug, number>;
};

export type SitemapTemplateEntry = {
  slug: string;
  updatedAt: Date;
};
