import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import {
  CATEGORIES,
  type CategorySort,
  getCategoryBySlug,
  isCategorySlug,
} from "@/lib/categories";
import { getTemplatesByCategory } from "@/lib/mock/templates";
import { categoryPath, categoryPathWithSort, discoveryPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

type CategoryRouteParams = {
  category: string;
};

type CategoryRouteSearchParams = {
  sort?: string | string[];
};

type CategoryPageProps = {
  params: Promise<CategoryRouteParams>;
  searchParams: Promise<CategoryRouteSearchParams>;
};

function getSortValue(sort: string | string[] | undefined): CategorySort {
  const first = Array.isArray(sort) ? sort[0] : sort;
  return first === "latest" ? "latest" : "popular";
}

function hasSortQuery(sort: string | string[] | undefined) {
  return typeof sort !== "undefined";
}

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ category }, { sort }] = await Promise.all([params, searchParams]);

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

  return buildSeoMetadata({
    title: categoryDefinition.seoTitle,
    description: categoryDefinition.seoDescription,
    path: categoryPath(categoryDefinition.slug),
    noindex: hasSortQuery(sort),
  });
}

export default async function CategoryTemplatesPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ category }, { sort }] = await Promise.all([params, searchParams]);

  if (!isCategorySlug(category)) {
    notFound();
  }

  const categoryDefinition = getCategoryBySlug(category);
  if (!categoryDefinition) {
    notFound();
  }

  const selectedSort = getSortValue(sort);
  const templates = getTemplatesByCategory(categoryDefinition.slug, selectedSort);

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
              selectedSort === "latest"
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </section>
    </OpenClawPageShell>
  );
}
