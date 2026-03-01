import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExtraSidebar } from "@/components/extra-sidebar";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateOwnerPanel } from "@/components/templates/template-owner-panel";
import { isAdmin } from "@/lib/auth/permissions";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { getCategoryBySlug } from "@/lib/categories";
import {
  categoryPath,
  templatePath,
} from "@/lib/routes";
import {
  getTemplateRecordBySlug,
  mapTemplateDTO,
} from "@/lib/templates/repository";
import {
  getTemplateDetailBySlugIncludingUnpublished,
  getPublishedTemplateBySlugCached,
} from "@/lib/templates/read-service";
import { listTemplateVersions } from "@/lib/templates/service";

export const dynamic = "force-dynamic";

type TemplateEditPageParams = {
  templateSlug: string;
};

type TemplateEditPageProps = {
  params: Promise<TemplateEditPageParams>;
};

export default async function TemplateEditPage({ params }: TemplateEditPageProps) {
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

  if (!canManageTemplate) {
    redirect(templatePath(templateSlug));
  }

  const detail = (await getTemplateDetailBySlugIncludingUnpublished(templateSlug)) ??
    (await getPublishedTemplateBySlugCached(templateSlug));

  if (!detail) {
    notFound();
  }

  const versions = await listTemplateVersions(templateRow.id);
  const category = getCategoryBySlug(detail.template.category);

  return (
    <OpenClawPageShell
      rightSidebar={(
        <ExtraSidebar
          variant="templateManage"
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
            createdAt: detail.template.createdAt,
            updatedAt: detail.template.updatedAt,
          }}
        />
      )}
    >
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
          <Link className="hover:text-foreground" href={templatePath(detail.template.slug)}>
            {detail.template.title}
          </Link>
          <span>/</span>
          <span className="text-foreground">Edit</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Template Edit
            </p>
            <h1 className="text-3xl sm:text-4xl">{detail.template.title}</h1>
          </div>
          <Link
            href={templatePath(detail.template.slug)}
            className="border border-border px-3 py-1.5 text-xs uppercase tracking-wide hover:border-cossistant-orange/40"
          >
            Back to template
          </Link>
        </div>
      </header>

      <section className="space-y-4">
        <TemplateOwnerPanel
          initialTemplate={mapTemplateDTO(templateRow)}
          initialVersions={versions}
          isAdmin={Boolean(session && isAdmin(session.user))}
        />
      </section>
    </OpenClawPageShell>
  );
}
