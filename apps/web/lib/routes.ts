import type { CategorySlug, CategorySort, DiscoverySlug } from "@/lib/categories";

export const OPENCLAW_TEMPLATES_BASE_PATH = "/openclaw/templates";
export const OPENCLAW_TEMPLATE_BASE_PATH = "/openclaw/template";
export const MEMBERS_BASE_PATH = "/members";

export function discoveryPath(slug: DiscoverySlug) {
  return `${OPENCLAW_TEMPLATES_BASE_PATH}/${slug}`;
}

export function categoryPath(slug: CategorySlug) {
  return `${OPENCLAW_TEMPLATES_BASE_PATH}/${slug}`;
}

export function categoryPathWithSort(slug: CategorySlug, sort: CategorySort) {
  return `${categoryPath(slug)}?sort=${sort}`;
}

export function templatePath(templateSlug: string) {
  return `${OPENCLAW_TEMPLATE_BASE_PATH}/${templateSlug}`;
}

export function membersPath() {
  return MEMBERS_BASE_PATH;
}

export function memberPath(username: string) {
  return `${MEMBERS_BASE_PATH}/${encodeURIComponent(username)}`;
}
