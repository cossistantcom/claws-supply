import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateFeedGrid } from "@/components/template-feed-grid";
import { listRenderableResultsAds } from "@/lib/ads/read-service";
import { getDiscoveryBySlug } from "@/lib/categories";
import { discoveryPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import { parseTemplateListQueryFromSearchParams } from "@/lib/templates/read-schemas";
import { listPublishedTemplatesCached } from "@/lib/templates/read-service";
import type { TemplateListQueryInput } from "@/lib/templates/public-types";
import type { Metadata } from "next";
import Link from "next/link";

const DISCOVERY = getDiscoveryBySlug("latest");
export const dynamic = "force-dynamic";

type DiscoverySearchParams = {
  sort?: string | string[];
  page?: string | string[];
  limit?: string | string[];
  freeOnly?: string | string[];
  search?: string | string[];
};

type DiscoveryPageProps = {
  searchParams: Promise<DiscoverySearchParams>;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseDiscoveryQuery(
  searchParams: DiscoverySearchParams,
): TemplateListQueryInput {
  try {
    const parsed = parseTemplateListQueryFromSearchParams(searchParams);
    return {
      ...parsed,
      sort: "newest",
    };
  } catch {
    return {
      sort: "newest",
      page: 1,
      limit: 20,
      freeOnly: false,
    };
  }
}

function isParamHeavyVariant(
  searchParams: DiscoverySearchParams,
  query: TemplateListQueryInput,
) {
  const hasSearch = Boolean(query.search);
  const hasPageBeyondFirst = query.page > 1;
  const rawSort = getFirstValue(searchParams.sort);
  const hasNonDefaultSort =
    rawSort !== undefined && rawSort !== "newest" && rawSort !== "latest";

  return hasSearch || hasPageBeyondFirst || hasNonDefaultSort;
}

export async function generateMetadata({
  searchParams,
}: DiscoveryPageProps): Promise<Metadata> {
  const rawSearchParams = await searchParams;

  if (!DISCOVERY) {
    return buildSeoMetadata({
      title: "Latest OpenClaw Templates — Claws.supply",
      description: "Browse the latest OpenClaw templates on Claws.supply.",
      path: discoveryPath("latest"),
      noindex: true,
    });
  }

  const query = parseDiscoveryQuery(rawSearchParams);

  return buildSeoMetadata({
    title: DISCOVERY.seoTitle,
    description: DISCOVERY.seoDescription,
    path: discoveryPath(DISCOVERY.slug),
    noindex: isParamHeavyVariant(rawSearchParams, query),
  });
}

export default async function LatestTemplatesPage({ searchParams }: DiscoveryPageProps) {
  const rawSearchParams = await searchParams;
  const query = parseDiscoveryQuery(rawSearchParams);
  const [result, sponsoredAds] = await Promise.all([
    listPublishedTemplatesCached(query),
    listRenderableResultsAds(),
  ]);
  const templates = result.items;

  return (
    <OpenClawPageShell>
      <header className="space-y-3 border-b border-border pb-6">
        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
          Discovery
        </p>
        <h1 className="text-3xl sm:text-4xl">Latest Templates</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Freshly published OpenClaw AI agent templates across all categories.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <Link className="hover:underline" href={discoveryPath("popular")}>
            View Popular
          </Link>
        </div>
      </header>

      {templates.length > 0 ? (
        <TemplateFeedGrid
          templates={templates}
          sponsoredAds={sponsoredAds}
          showCategory
        />
      ) : (
        <section className="border border-border p-4 text-xs text-muted-foreground">
          No published templates are available yet.
        </section>
      )}
    </OpenClawPageShell>
  );
}
