import { CATEGORIES, DISCOVERY_PAGES } from "@/lib/categories";
import { listMembersForSitemapCached } from "@/lib/members/read-service";
import {
  categoryPath,
  discoveryPath,
  memberPath,
  membersPath,
  templatePath,
} from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";
import { listPublishedTemplateSlugsForSitemapCached } from "@/lib/templates/read-service";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [templates, members] = await Promise.all([
    listPublishedTemplateSlugsForSitemapCached(),
    listMembersForSitemapCached(),
  ]);

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl(membersPath()),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
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
    ...members.map((member) => ({
      url: absoluteUrl(memberPath(member.username)),
      lastModified: member.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...templates.map((template) => ({
      url: absoluteUrl(templatePath(template.slug)),
      lastModified: template.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
