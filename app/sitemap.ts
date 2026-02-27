import { CATEGORIES, DISCOVERY_PAGES } from "@/lib/categories";
import { getAllMockTemplates } from "@/lib/mock/templates";
import { categoryPath, discoveryPath, templatePath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
    ...getAllMockTemplates().map((template) => ({
      url: absoluteUrl(templatePath(template.slug)),
      lastModified: new Date(template.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
