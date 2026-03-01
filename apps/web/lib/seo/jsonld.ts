import type { PublicMember } from "@/lib/members/types";
import type { PublicTemplateDetail } from "@/lib/templates/public-types";
import { absoluteUrl, getDefaultOgImagePath } from "@/lib/seo";

const SCHEMA_CONTEXT = "https://schema.org";

function toPriceString(priceCents: number) {
  return (priceCents / 100).toFixed(2);
}

function toUpperCurrency(value: string) {
  return value.trim().toUpperCase();
}

function toJsonLdImage(imageUrl: string | null) {
  return imageUrl ?? absoluteUrl(getDefaultOgImagePath());
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildHomepageJsonLd() {
  const siteUrl = absoluteUrl("/");
  const organizationSchema = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: "Claws.supply",
    url: siteUrl,
    logo: absoluteUrl("/claw.png"),
  };
  const websiteSchema = {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: "Claws.supply",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/openclaw/templates/latest")}?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return [organizationSchema, websiteSchema];
}

export function buildTemplateProductJsonLd(input: {
  detail: PublicTemplateDetail;
  templateUrl: string;
  categoryLabel: string | null;
}) {
  const { detail, templateUrl, categoryLabel } = input;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    name: detail.template.title,
    description: detail.template.shortDescription,
    sku: detail.template.id,
    category: categoryLabel ?? undefined,
    image: toJsonLdImage(detail.template.coverImageUrl),
    url: templateUrl,
    brand: {
      "@type": "Brand",
      name: "Claws.supply",
    },
    offers: {
      "@type": "Offer",
      url: templateUrl,
      price: toPriceString(detail.template.priceCents),
      priceCurrency: toUpperCurrency(detail.template.currency),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Person",
        name: detail.seller.displayName,
        url: absoluteUrl(`/members/${detail.seller.username}`),
      },
    },
    aggregateRating: detail.stats.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: detail.stats.rating.toFixed(1),
          reviewCount: detail.stats.reviewCount,
        }
      : undefined,
  };
}

export function buildMemberPersonJsonLd(input: {
  member: PublicMember;
  memberUrl: string;
}) {
  const { member, memberUrl } = input;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: member.name,
    alternateName: `@${member.username}`,
    description:
      member.bio ??
      `View @${member.username}'s public Claws.supply profile and published OpenClaw templates.`,
    url: memberUrl,
    image: member.image ?? undefined,
  };
}
