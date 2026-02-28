import { CATEGORIES, DISCOVERY_PAGES } from "@/lib/categories";
import { categoryPath, discoveryPath, templatePath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { listPublishedTemplateSlugsForSitemapCached } from "@/lib/templates/read-service";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const templates = await listPublishedTemplateSlugsForSitemapCached();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...DISCOVERY_PAGES.map((discovery) => ({
      url: absoluteUrl(discoveryPath(discovery.slug)),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...CATEGORIES.map((category) => ({
      url: absoluteUrl(categoryPath(category.slug)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...templates.map((template) => ({
      url: absoluteUrl(templatePath(template.slug)),
      lastModified: template.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
