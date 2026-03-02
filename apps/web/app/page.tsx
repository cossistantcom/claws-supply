import type { Metadata } from "next";
import { AsciiPhoneShowcase } from "@/components/ascii-phone-showcase";
import { LandingCommandDemo } from "@/components/landing-command-demo";
import { LobsterClawIcon } from "@/components/lobster-claw";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateFeedGrid } from "@/components/template-feed-grid";
import { discoveryPath } from "@/lib/routes";
import {
  buildSeoMetadata,
  DEFAULT_SITE_TAGLINE,
  getDefaultOgImagePath,
} from "@/lib/seo";
import { buildHomepageJsonLd, serializeJsonLd } from "@/lib/seo/jsonld";
import { listPublishedTemplatesCached } from "@/lib/templates/read-service";
import type {
  PublicTemplateCard,
  TemplateListSort,
} from "@/lib/templates/public-types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildSeoMetadata({
  title: DEFAULT_SITE_TAGLINE,
  description:
    "Discover popular and latest OpenClaw agent templates, and launch faster with production-ready setups.",
  path: "/",
  imagePath: getDefaultOgImagePath(),
  dynamicOg: null,
});

const homepageJsonLd = buildHomepageJsonLd();

const TOP_POPULAR_LIMIT = 4;
const LATEST_LIMIT = 4;
const MORE_POPULAR_LIMIT = 24;
const FEED_PAGE_SIZE = 20;

type HomepageSectionProps = {
  title: string;
  description: string;
  viewAllHref: string;
  viewAllLabel: string;
  templates: PublicTemplateCard[];
};

async function collectUniqueTemplates(input: {
  sort: TemplateListSort;
  limit: number;
  excludedIds?: Iterable<string>;
}): Promise<PublicTemplateCard[]> {
  const templates: PublicTemplateCard[] = [];
  const seenIds = new Set<string>(input.excludedIds ?? []);
  let page = 1;

  while (templates.length < input.limit) {
    const result = await listPublishedTemplatesCached({
      sort: input.sort,
      page,
      limit: FEED_PAGE_SIZE,
      freeOnly: false,
    });

    if (result.items.length === 0) {
      break;
    }

    for (const template of result.items) {
      if (seenIds.has(template.id)) {
        continue;
      }

      seenIds.add(template.id);
      templates.push(template);

      if (templates.length >= input.limit) {
        break;
      }
    }

    if (!result.hasNextPage) {
      break;
    }

    page += 1;
  }

  return templates;
}

function HomepageTemplateSection({
  title,
  description,
  viewAllHref,
  viewAllLabel,
  templates,
}: HomepageSectionProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
          Discovery
        </p>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold leading-tight">{title}</h2>
          <Link href={viewAllHref} className="text-xs hover:underline shrink-0">
            {viewAllLabel}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <TemplateFeedGrid templates={templates} />
    </article>
  );
}

export default async function Page() {
  const popularTop = await collectUniqueTemplates({
    sort: "popular",
    limit: TOP_POPULAR_LIMIT,
  });
  const latest = await collectUniqueTemplates({
    sort: "newest",
    limit: LATEST_LIMIT,
    excludedIds: popularTop.map((template) => template.id),
  });
  const morePopular = await collectUniqueTemplates({
    sort: "popular",
    limit: MORE_POPULAR_LIMIT,
    excludedIds: [...popularTop, ...latest].map((template) => template.id),
  });
  const hasTemplates =
    popularTop.length > 0 || latest.length > 0 || morePopular.length > 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageJsonLd) }}
      />
      <div className="overflow-x-clip min-h-screen relative mt-20 px-6 md:px-0">
        <OpenClawPageShell contentClassName="w-full max-w-4xl space-y-10">
          <div className="flex-1 flex flex-col gap-4">
            <LobsterClawIcon className="size-20" />
            <h1 className="text-3xl sm:text-3xl md:text-4xl xl:text-5xl leading-[1.3] tracking-tight text-balance">
              {DEFAULT_SITE_TAGLINE}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              Discover trending Openclaw templates and deploy pre-configured,
              production-ready OpenClaw AI agents faster.
            </p>

            <LandingCommandDemo />
          </div>

          <section className="space-y-12 pt-8 md:pt-12">
            {hasTemplates ? (
              <>
                <HomepageTemplateSection
                  title="Most Popular"
                  description="Most-downloaded OpenClaw AI agent templates right now."
                  viewAllHref={discoveryPath("popular")}
                  viewAllLabel="View all popular"
                  templates={popularTop}
                />
                <HomepageTemplateSection
                  title="Latest"
                  description="Freshly published OpenClaw AI agent templates."
                  viewAllHref={discoveryPath("latest")}
                  viewAllLabel="View all latest"
                  templates={latest}
                />
                <HomepageTemplateSection
                  title="More Popular"
                  description="More high-traffic OpenClaw templates to explore."
                  viewAllHref={discoveryPath("popular")}
                  viewAllLabel="View all popular"
                  templates={morePopular}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground border border-border p-4">
                No published templates are available yet.
              </p>
            )}
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
