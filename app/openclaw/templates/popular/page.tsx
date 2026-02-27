import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import { getDiscoveryBySlug } from "@/lib/categories";
import { getPopularTemplates } from "@/lib/mock/templates";
import { discoveryPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const DISCOVERY = getDiscoveryBySlug("popular");

export function generateMetadata(): Metadata {
  if (!DISCOVERY) {
    return buildSeoMetadata({
      title: "Popular OpenClaw Templates — Claws.supply",
      description: "Browse popular OpenClaw templates on Claws.supply.",
      path: discoveryPath("popular"),
      noindex: true,
    });
  }

  return buildSeoMetadata({
    title: DISCOVERY.seoTitle,
    description: DISCOVERY.seoDescription,
    path: discoveryPath(DISCOVERY.slug),
  });
}

export default function PopularTemplatesPage() {
  const templates = getPopularTemplates();

  return (
    <OpenClawPageShell>
      <header className="space-y-3 border-b border-border pb-6">
        <p className="font-pixel text-[11px] tracking-wider text-muted-foreground uppercase">
          Discovery
        </p>
        <h1 className="font-pixel text-3xl sm:text-4xl">Popular Templates</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Most-downloaded OpenClaw AI agent templates right now.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <Link className="font-pixel hover:underline" href={discoveryPath("latest")}>
            View Latest
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard key={template.slug} template={template} showCategory />
        ))}
      </section>
    </OpenClawPageShell>
  );
}
