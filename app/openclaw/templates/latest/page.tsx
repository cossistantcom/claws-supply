import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import { getDiscoveryBySlug } from "@/lib/categories";
import { getLatestTemplates } from "@/lib/mock/templates";
import { discoveryPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const DISCOVERY = getDiscoveryBySlug("latest");

export function generateMetadata(): Metadata {
  if (!DISCOVERY) {
    return buildSeoMetadata({
      title: "Latest OpenClaw Templates — Claws.supply",
      description: "Browse the latest OpenClaw templates on Claws.supply.",
      path: discoveryPath("latest"),
      noindex: true,
    });
  }

  return buildSeoMetadata({
    title: DISCOVERY.seoTitle,
    description: DISCOVERY.seoDescription,
    path: discoveryPath(DISCOVERY.slug),
  });
}

export default function LatestTemplatesPage() {
  const templates = getLatestTemplates();

  return (
    <OpenClawPageShell>
      <header className="space-y-3 border-b border-border pb-6">
        <p className="font-pixel text-[11px] tracking-wider text-muted-foreground uppercase">
          Discovery
        </p>
        <h1 className="font-pixel text-3xl sm:text-4xl">Latest Templates</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Freshly published OpenClaw AI agent templates across all categories.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <Link className="font-pixel hover:underline" href={discoveryPath("popular")}>
            View Popular
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
