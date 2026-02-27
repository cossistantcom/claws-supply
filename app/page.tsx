import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { AsciiPhoneShowcase } from "@/components/ascii-phone-showcase";
import { AsciiClawsShowcase } from "@/components/claws-showcase";
import { Menu } from "@/components/section-menu";
import { TemplateCard } from "@/components/template-card";
import { CATEGORIES, DISCOVERY_PAGES } from "@/lib/categories";
import { getTemplatesByCategory, getTemplatesByDiscovery } from "@/lib/mock/templates";
import { categoryPath, discoveryPath } from "@/lib/routes";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Claws.supply — OpenClaw Agent Templates Marketplace",
  description:
    "Explore category-based OpenClaw agent templates, discover popular and latest releases, and launch faster with production-ready setups.",
};

export default async function Page() {
  const discoverySections = DISCOVERY_PAGES.map((discovery) => ({
    ...discovery,
    href: discoveryPath(discovery.slug),
    templates: getTemplatesByDiscovery(discovery.slug, 4),
  }));

  const categorySections = CATEGORIES.map((category) => ({
    ...category,
    href: categoryPath(category.slug),
    templates: getTemplatesByCategory(category.slug, "popular", 4),
  }));

  return (
    <>
      <div className="overflow-x-clip min-h-screen relative mt-40 flex gap-6 px-6 md:px-0">
        <div className="hidden md:flex sticky top-40 h-[calc(100vh-3rem)]">
          <Menu />
        </div>
        <div className="flex flex-col gap-10 w-full max-w-4xl mx-auto">
          <div className="flex items-stretch gap-10">
            <div className="2xl:block hidden aspect-square h-full w-full max-w-40 overflow-clip relative bg-primary/[0.03]">
              <AsciiClawsShowcase />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <h1 className="font-pixel text-3xl sm:text-3xl md:text-4xl xl:text-5xl leading-[1.3] tracking-tight text-balance">
                OpenClaw template marketplace for every workflow.
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                Navigate by category, discover what is trending, and deploy pre-configured
                OpenClaw agents faster.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  className="border border-border px-3 py-1 font-pixel text-xs hover:bg-muted transition-colors"
                  href={discoveryPath("popular")}
                >
                  BROWSE POPULAR
                </Link>
                <Link
                  className="border border-border px-3 py-1 font-pixel text-xs hover:bg-muted transition-colors"
                  href={discoveryPath("latest")}
                >
                  BROWSE LATEST
                </Link>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {discoverySections.map((section) => (
              <Link
                key={section.slug}
                href={section.href}
                className="border border-border p-4 space-y-2 hover:bg-muted/30 transition-colors"
              >
                <p className="font-pixel text-xs uppercase tracking-wide text-muted-foreground">
                  Discovery
                </p>
                <h2 className="font-pixel text-xl">{section.label}</h2>
                <p className="text-xs text-muted-foreground">{section.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {section.templates.length} templates indexed
                </p>
              </Link>
            ))}
          </section>

          <section className="space-y-12">
            {categorySections.map((section) => (
              <article key={section.slug} className="space-y-4">
                <header className="space-y-2">
                  <Link href={section.href} className="inline-flex items-center gap-2">
                    <h2 className="font-pixel text-2xl hover:underline">
                      {section.label}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({section.templates.length})
                    </span>
                  </Link>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </header>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {section.templates.map((template) => (
                    <TemplateCard key={template.slug} template={template} />
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
        <aside className="hidden lg:flex sticky top-40 h-[calc(100vh-3rem)] right-0 w-64 gap-4 flex-col pr-6 text-xs">
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
          <div className="bg-primary/5 flex items-center justify-center w-full h-12">
            advertise here
          </div>
        </aside>
      </div>

      {/* ── DAILY BRIEFING PHONE ── */}
      <section className="bg-background overflow-x-clip">
        <div className="relative left-1/2 w-screen -translate-x-1/2">
          <AsciiPhoneShowcase />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-sm tracking-wider uppercase">
              claws.supply
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-pixel tracking-wider text-muted-foreground">
            <Link className="hover:text-foreground" href="/terms">
              TERMS
            </Link>
            <Link className="hover:text-foreground" href="/policy">
              POLICY
            </Link>
            <span>2026</span>
          </div>
        </div>
      </footer>
      <Navbar />
    </>
  );
}
