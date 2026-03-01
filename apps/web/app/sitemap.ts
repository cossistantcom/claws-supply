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
import { source } from "@/lib/source";
import { listPublishedTemplateSlugsForSitemapCached } from "@/lib/templates/read-service";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const STATIC_PUBLIC_PAGES = [
  {
    path: "/advertise",
    changeFrequency: "monthly" as const,
    priority: 0.55,
  },
  {
    path: "/terms",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    path: "/policy",
    changeFrequency: "yearly" as const,
    priority: 0.3,
  },
  {
    path: "/openclaw/templates/publish-via-cli",
    changeFrequency: "monthly" as const,
    priority: 0.6,
  },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const docsPathSet = new Set<string>(
    source.getPages().map((page) => page.url).filter((url) => url.startsWith("/docs")),
  );
  docsPathSet.add("/docs");
  const docsPaths = Array.from(docsPathSet).sort();
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
    ...STATIC_PUBLIC_PAGES.map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...docsPaths.map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/docs" ? 0.8 : 0.72,
    })),
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
