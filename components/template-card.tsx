import { getCategoryBySlug } from "@/lib/categories";
import type { PublicTemplateCard } from "@/lib/templates/public-types";
import { categoryPath, templatePath } from "@/lib/routes";
import Link from "next/link";

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

type TemplateCardProps = {
  template: PublicTemplateCard;
  showCategory?: boolean;
};

export function TemplateCard({ template, showCategory = false }: TemplateCardProps) {
  const category = getCategoryBySlug(template.category);

  return (
    <article className="border border-border bg-background/70 p-4 flex flex-col gap-4">
      {showCategory && category ? (
        <Link
          href={categoryPath(category.slug)}
          className="w-fit text-[10px] tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          {category.label}
        </Link>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-base leading-tight">
          <Link className="hover:underline" href={templatePath(template.slug)}>
            {template.title}
          </Link>
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {template.shortDescription}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <p>{formatPrice(template.priceCents, template.currency)}</p>
        <p className="text-right">{template.downloadCount.toLocaleString()} downloads</p>
        <p>Rating {template.rating.toFixed(1)}</p>
        <p className="text-right">{template.reviewCount} reviews</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px]">
        <p className="text-muted-foreground">by @{template.seller.username}</p>
        <Link
          className="text-xs hover:underline underline-offset-4"
          href={templatePath(template.slug)}
        >
          View Template
        </Link>
      </div>
    </article>
  );
}
