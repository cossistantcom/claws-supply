import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import { getCategoryBySlug } from "@/lib/categories";
import { categoryPath, discoveryPath, templatePath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import { getPublishedTemplateBySlugCached } from "@/lib/templates/read-service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type TemplatePageParams = {
  templateSlug: string;
};

type TemplatePageProps = {
  params: Promise<TemplatePageParams>;
};

function formatPrice(priceCents: number, currency: string) {
  if (priceCents === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export async function generateMetadata({
  params,
}: TemplatePageProps): Promise<Metadata> {
  const { templateSlug } = await params;
  const detail = await getPublishedTemplateBySlugCached(templateSlug);

  if (!detail) {
    return buildSeoMetadata({
      title: "Template Not Found — Claws.supply",
      description: "This OpenClaw template page does not exist.",
      path: "/openclaw/template",
      noindex: true,
    });
  }

  return buildSeoMetadata({
    title: `${detail.template.title} — OpenClaw Template on Claws.supply`,
    description: detail.template.shortDescription,
    path: templatePath(detail.template.slug),
  });
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { templateSlug } = await params;
  const detail = await getPublishedTemplateBySlugCached(templateSlug);

  if (!detail) {
    notFound();
  }

  const category = getCategoryBySlug(detail.template.category);
  const relatedTemplates = detail.relatedTemplates;

  return (
    <OpenClawPageShell>
      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Link className="hover:text-foreground" href="/">
            Home
          </Link>
          <span>/</span>
          {category ? (
            <>
              <Link className="hover:text-foreground" href={categoryPath(category.slug)}>
                {category.label}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-foreground">{detail.template.title}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl">{detail.template.title}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          {detail.template.description}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="border border-border p-3">
            <p className="text-muted-foreground">Price</p>
            <p className="text-sm">
              {formatPrice(detail.template.priceCents, detail.template.currency)}
            </p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground">Downloads</p>
            <p className="text-sm">
              {detail.stats.downloadCount.toLocaleString()}
            </p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground">Rating</p>
            <p className="text-sm">{detail.stats.rating.toFixed(1)}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-muted-foreground">Reviews</p>
            <p className="text-sm">{detail.stats.reviewCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {category ? (
            <Link className="hover:underline" href={categoryPath(category.slug)}>
              Browse {category.label}
            </Link>
          ) : null}
          <Link className="hover:underline" href={discoveryPath("latest")}>
            Latest templates
          </Link>
          <Link className="hover:underline" href={discoveryPath("popular")}>
            Popular templates
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg">Seller</h2>
        <div className="border border-border p-4 text-sm">
          <p className="text-base">{detail.seller.displayName}</p>
          <p className="text-muted-foreground">@{detail.seller.username}</p>
          <p className="text-muted-foreground mt-2">
            {detail.seller.isVerified
              ? "Verified seller"
              : "Seller profile pending verification"}
          </p>
        </div>
      </section>

      {relatedTemplates.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg">Similar Templates</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {relatedTemplates.map((relatedTemplate) => (
              <TemplateCard key={relatedTemplate.slug} template={relatedTemplate} />
            ))}
          </div>
        </section>
      ) : null}
    </OpenClawPageShell>
  );
}
