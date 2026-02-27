import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import {
  getCategoryBySlug,
  isCategorySlug,
} from "@/lib/categories";
import { categoryPath, categoryPathWithSort, discoveryPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import { parseTemplateListQueryFromSearchParams } from "@/lib/templates/read-schemas";
import { listPublishedTemplatesCached } from "@/lib/templates/read-service";
import type { TemplateListQueryInput } from "@/lib/templates/public-types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type CategoryRouteParams = {
  category: string;
};

type CategoryRouteSearchParams = {
  sort?: string | string[];
  page?: string | string[];
  limit?: string | string[];
  freeOnly?: string | string[];
  search?: string | string[];
};

type CategoryPageProps = {
  params: Promise<CategoryRouteParams>;
  searchParams: Promise<CategoryRouteSearchParams>;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseCategoryListQuery(
  searchParams: CategoryRouteSearchParams,
): TemplateListQueryInput {
  const rawSort = getFirstValue(searchParams.sort);

  try {
    const parsed = parseTemplateListQueryFromSearchParams(searchParams);

    return {
      ...parsed,
      sort: rawSort ? parsed.sort : "popular",
    };
  } catch {
    return {
      sort: "popular",
      page: 1,
      limit: 20,
      freeOnly: false,
    };
  }
}

function isParamHeavyVariant(
  searchParams: CategoryRouteSearchParams,
  query: TemplateListQueryInput,
) {
  const hasSearch = Boolean(query.search);
  const hasNonDefaultSort = getFirstValue(searchParams.sort) !== undefined && query.sort !== "popular";
  const hasPageBeyondFirst = query.page > 1;

  return hasSearch || hasNonDefaultSort || hasPageBeyondFirst;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ category }, rawSearchParams] = await Promise.all([params, searchParams]);

  if (!isCategorySlug(category)) {
    return buildSeoMetadata({
      title: "Category Not Found — Claws.supply",
      description: "This category page does not exist.",
      path: "/openclaw/templates",
      noindex: true,
    });
  }

  const categoryDefinition = getCategoryBySlug(category);
  if (!categoryDefinition) {
    return buildSeoMetadata({
      title: "Category Not Found — Claws.supply",
      description: "This category page does not exist.",
      path: "/openclaw/templates",
      noindex: true,
    });
  }

  const query = parseCategoryListQuery(rawSearchParams);

  return buildSeoMetadata({
    title: categoryDefinition.seoTitle,
    description: categoryDefinition.seoDescription,
    path: categoryPath(categoryDefinition.slug),
    noindex: isParamHeavyVariant(rawSearchParams, query),
  });
}

export default async function CategoryTemplatesPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ category }, rawSearchParams] = await Promise.all([params, searchParams]);

  if (!isCategorySlug(category)) {
    notFound();
  }

  const categoryDefinition = getCategoryBySlug(category);
  if (!categoryDefinition) {
    notFound();
  }

  const query = parseCategoryListQuery(rawSearchParams);
  const selectedSort = query.sort;
  const result = await listPublishedTemplatesCached({
    ...query,
    category: categoryDefinition.slug,
  });
  const templates = result.items;

  return (
    <OpenClawPageShell>
      <header className="space-y-3 border-b border-border pb-6">
        <p className="font-pixel text-[11px] tracking-wider text-muted-foreground uppercase">
          Category
        </p>
        <h1 className="font-pixel text-3xl sm:text-4xl">{categoryDefinition.label}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {categoryDefinition.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link
            href={categoryPath(categoryDefinition.slug)}
            className={[
              "border border-border px-3 py-1 text-[11px] font-pixel uppercase tracking-wide",
              selectedSort === "popular"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Most Popular
          </Link>
          <Link
            href={categoryPathWithSort(categoryDefinition.slug, "latest")}
            className={[
              "border border-border px-3 py-1 text-[11px] font-pixel uppercase tracking-wide",
              selectedSort === "newest"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            Latest
          </Link>
          <Link
            href={discoveryPath("popular")}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Global popular
          </Link>
          <Link
            href={discoveryPath("latest")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Global latest
          </Link>
        </div>
      </header>

      {templates.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <TemplateCard key={template.slug} template={template} />
          ))}
        </section>
      ) : (
        <section className="border border-border p-4 text-xs text-muted-foreground">
          No published templates found for this category.
        </section>
      )}
    </OpenClawPageShell>
  );
}
