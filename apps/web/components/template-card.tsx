import { getCategoryBySlug } from "@/lib/categories";
import { MemberAvatar } from "@/components/members/member-avatar";
import type { PublicTemplateCard } from "@/lib/templates/public-types";
import { memberPath, templatePath } from "@/lib/routes";
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
    <article className="relative flex flex-col gap-4 border border-border bg-background/70 p-4 transition-colors hover:border-cossistant-orange/40 focus-within:border-cossistant-orange/40">
      {showCategory && category ? (
        <p className="w-fit text-[10px] tracking-wide uppercase text-muted-foreground">
          {category.label}
        </p>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-base leading-tight">{template.title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {template.excerpt}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <p>{formatPrice(template.priceCents, template.currency)}</p>
        <p className="text-right">{template.downloadCount.toLocaleString()} downloads</p>
        <p>Rating {template.rating.toFixed(1)}</p>
        <p className="text-right">{template.reviewCount} reviews</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-[11px]">
        <Link
          className="relative z-20 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          href={memberPath(template.seller.username)}
        >
          <MemberAvatar
            name={template.seller.displayName}
            username={template.seller.username}
            image={template.seller.avatarUrl}
            className="size-5 border-border"
            fallbackClassName="text-[8px]"
          />
          <span>@{template.seller.username}</span>
        </Link>
        <p className="text-xs text-muted-foreground">View Template</p>
      </div>

      <Link
        href={templatePath(template.slug)}
        aria-label={`View template ${template.title}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      />
    </article>
  );
}
