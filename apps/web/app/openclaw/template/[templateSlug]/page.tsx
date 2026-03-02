import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommandCopyRow } from "@/components/command-copy-row";
import { ExtraSidebar } from "@/components/extra-sidebar";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateCard } from "@/components/template-card";
import { TemplateCommentsSection } from "@/components/templates/template-comments-section";
import { TemplatePurchaseCommandAction } from "@/components/templates/template-purchase-command-action";
import { buttonVariants } from "@/components/ui/button";
import { isAdmin } from "@/lib/auth/permissions";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { getCategoryBySlug } from "@/lib/categories";
import {
  categoryPath,
  discoveryPath,
  templatePath,
} from "@/lib/routes";
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo";
import {
  buildTemplateProductJsonLd,
  serializeJsonLd,
} from "@/lib/seo/jsonld";
import { getTemplateRecordBySlug } from "@/lib/templates/repository";
import {
  getTemplateDetailBySlugIncludingUnpublished,
  getPublishedTemplateBySlugCached,
} from "@/lib/templates/read-service";
import { getPaidTemplateAccessForActor } from "@/lib/templates/service";
import { cn } from "@/lib/utils";

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
    maximumFractionDigits: 2,
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
    description: detail.template.excerpt,
    path: templatePath(detail.template.slug),
    ogType: "article",
  });
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { templateSlug } = await params;
  const [session, templateRow] = await Promise.all([
    getSessionFromNextHeaders(),
    getTemplateRecordBySlug(templateSlug),
  ]);

  if (!templateRow || templateRow.status === "deleted") {
    notFound();
  }

  const canManageTemplate = Boolean(
    session &&
      (session.user.id === templateRow.sellerId || isAdmin(session.user)),
  );

  if (templateRow.status !== "published" && !canManageTemplate) {
    notFound();
  }

  let detail = templateRow.status === "published"
    ? await getPublishedTemplateBySlugCached(templateSlug)
    : null;

  if (!detail && canManageTemplate) {
    detail = await getTemplateDetailBySlugIncludingUnpublished(templateSlug);
  }

  if (!detail) {
    notFound();
  }

  const category = getCategoryBySlug(detail.template.category);
  const relatedTemplates = detail.relatedTemplates;
  const discoveryLinks = [
    ...(category
      ? [
          {
            label: `Browse ${category.label}`,
            href: categoryPath(category.slug),
          },
        ]
      : []),
    {
      label: "Latest templates",
      href: discoveryPath("latest"),
    },
    {
      label: "Popular templates",
      href: discoveryPath("popular"),
    },
  ];
  const templateUrl = absoluteUrl(templatePath(detail.template.slug));
  const productJsonLd = buildTemplateProductJsonLd({
    detail,
    templateUrl,
    categoryLabel: category?.label ?? null,
  });
  const command = `npx claws-supply use ${detail.template.slug}`;
  const isPaidTemplate = detail.template.priceCents > 0;
  const paidTemplateAccess =
    isPaidTemplate && session
      ? await getPaidTemplateAccessForActor(
          {
            id: session.user.id,
            role: session.user.role,
          },
          templateRow,
        )
      : null;
  const canUseTemplateCommand = !isPaidTemplate || Boolean(paidTemplateAccess?.hasAccess);
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(templatePath(detail.template.slug))}`;
  const purchaseLabel = formatPrice(detail.template.priceCents, detail.template.currency);

  return (
    <OpenClawPageShell
      contentClassName="w-full max-w-4xl space-y-10"
      rightSidebar={(
        <ExtraSidebar
          variant="templateCompact"
          seller={{
            displayName: detail.seller.displayName,
            username: detail.seller.username,
            avatarUrl: detail.seller.avatarUrl,
            isVerified: detail.seller.isVerified,
          }}
          template={{
            slug: detail.template.slug,
            status: templateRow.status,
            version: detail.template.version,
          }}
          discoveryLinks={discoveryLinks}
          canManageTemplate={canManageTemplate}
        />
      )}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <header className="space-y-5 border-b border-border pb-6">
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

        <div className="flex flex-wrap items-center gap-10 sm:gap-14 text-lg sm:text-xl">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Price</p>
            <p>{formatPrice(detail.template.priceCents, detail.template.currency)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Rating</p>
            <p>{detail.stats.rating.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reviews</p>
            <p>{detail.stats.reviewCount.toLocaleString()}</p>
          </div>
        </div>

        <p className="max-w-3xl text-sm text-muted-foreground">
          {detail.template.description}
        </p>
      </header>

      <section className="space-y-2">
        <CommandCopyRow
          label={canUseTemplateCommand ? "USE THIS TEMPLATE" : "LOCKED COMMAND"}
          command={command}
          action={
            !canUseTemplateCommand
              ? session
                ? (
                    <TemplatePurchaseCommandAction
                      templateSlug={detail.template.slug}
                      priceLabel={purchaseLabel}
                    />
                  )
                : (
                    <Link
                      href={signInHref}
                      className={cn(
                        buttonVariants({
                          variant: "outline",
                          size: "sm",
                        }),
                        "shrink-0 whitespace-nowrap",
                      )}
                    >
                      Sign in to purchase
                    </Link>
                  )
              : undefined
          }
        />
        {isPaidTemplate && !canUseTemplateCommand ? (
          <p className="text-xs text-muted-foreground">
            This is a paid template. Purchase unlocks CLI usage and download access.
          </p>
        ) : null}
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

      {detail.template.versionNotes ? (
        <section>
          <details className="border border-border bg-muted/20 p-3 text-xs">
            <summary className="cursor-pointer uppercase tracking-wide text-muted-foreground">
              What&apos;s New
            </summary>
            <p className="mt-2">
              {detail.template.version ? `v${detail.template.version}: ` : ""}
              {detail.template.versionNotes}
            </p>
          </details>
        </section>
      ) : null}

      {templateRow.status === "published" ? (
        <TemplateCommentsSection templateSlug={detail.template.slug} />
      ) : null}

      <section className="lg:hidden border border-border bg-background/70 p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Explore
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {discoveryLinks.map((discoveryLink) => (
            <Link key={discoveryLink.href} className="hover:underline" href={discoveryLink.href}>
              {discoveryLink.label}
            </Link>
          ))}
        </div>
      </section>
    </OpenClawPageShell>
  );
}
