import { Metadata } from "next";
import { AsciiPhoneShowcase } from "@/components/ascii-phone-showcase";
import { AsciiClawsShowcase } from "@/components/claws-showcase";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import { CATEGORIES } from "@/lib/categories";
import { categoryPath } from "@/lib/routes";
import {
  getTemplateCountsForMenuCached,
  listPublishedTemplatesCached,
} from "@/lib/templates/read-service";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claws.supply — OpenClaw AI Agent Templates Marketplace",
  description:
    "Explore category-based OpenClaw agent templates, discover popular and latest releases, and launch faster with production-ready setups.",
};

export default async function Page() {
  const [counts, categoryResults] = await Promise.all([
    getTemplateCountsForMenuCached(),
    Promise.all(
      CATEGORIES.map((category) =>
        listPublishedTemplatesCached({
          category: category.slug,
          sort: "popular",
          page: 1,
          limit: 4,
          freeOnly: false,
        }),
      ),
    ),
  ]);

  const categorySections = CATEGORIES.map((category, index) => ({
    ...category,
    href: categoryPath(category.slug),
    templates: categoryResults[index]?.items ?? [],
    count: counts.categories[category.slug] ?? 0,
  }));

  return (
    <>
      <div className="overflow-x-clip min-h-screen relative mt-40 px-6 md:px-0">
        <OpenClawPageShell contentClassName="w-full max-w-4xl space-y-10">
          <div className="flex items-stretch gap-10">
            <div className="2xl:block hidden aspect-square h-full w-full max-w-40 overflow-clip relative bg-primary/[0.03]">
              <AsciiClawsShowcase />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <h1 className="text-3xl sm:text-3xl md:text-4xl xl:text-5xl leading-[1.3] tracking-tight text-balance">
                Explore and sell vetted OpenClaw templates.
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                Discover trending Openclaw templates and deploy pre-configured,
                production-ready OpenClaw AI agents faster.
              </p>
            </div>
          </div>

          <section className="space-y-12 pt-8 md:pt-12">
            {categorySections.map((section) => (
              <article key={section.slug} className="space-y-4">
                <header className="space-y-2">
                  <Link
                    href={section.href}
                    className="inline-flex items-center gap-2"
                  >
                    <h2 className="text-lg sm:text-xl font-semibold leading-tight hover:underline">
                      {section.label}
                    </h2>
                    <span className="text-xs font-medium text-cossistant-orange">
                      [{section.count}]
                    </span>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </header>

                {section.templates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {section.templates.map((template) => (
                      <TemplateCard key={template.slug} template={template} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground border border-border p-4">
                    No published templates in this category yet.
                  </p>
                )}
              </article>
            ))}
          </section>
        </OpenClawPageShell>
      </div>

      {/* ── DAILY BRIEFING PHONE ── */}
      <section className="bg-background overflow-x-clip mt-40">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <AsciiPhoneShowcase />
        </div>
      </section>
    </>
  );
}
