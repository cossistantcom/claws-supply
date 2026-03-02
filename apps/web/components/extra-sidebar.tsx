import Link from "next/link";
import { MemberAvatar } from "@/components/members/member-avatar";
import { ProfileSellerIdentity } from "@/components/profile/profile-seller-identity";
import { TemplateLifecycleSidebarActions } from "@/components/templates/template-lifecycle-sidebar-actions";
// import { SidebarAdStack } from "@/components/ads/sidebar-ad-stack";
import { getCommunitySidebarSnapshotCached } from "@/lib/members/read-service";
import { memberPath, templateEditPath } from "@/lib/routes";

// const SIDEBAR_SLOT_COUNT = 5;
const COMMUNITY_MEMBER_LIMIT = 10;

type SidebarTemplateStatus = "draft" | "published" | "unpublished" | "deleted";

type SidebarSeller = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isVerified: boolean;
};

type CommunitySidebarProps = {
  variant?: "community";
};

type TemplateCompactSidebarProps = {
  variant: "templateCompact";
  seller: SidebarSeller;
  template: {
    slug: string;
    status: SidebarTemplateStatus;
    version: number | null;
  };
  discoveryLinks: Array<{
    label: string;
    href: string;
  }>;
  canManageTemplate: boolean;
};

type TemplateManageSidebarProps = {
  variant: "templateManage";
  seller: SidebarSeller;
  template: {
    slug: string;
    status: SidebarTemplateStatus;
    version: number | null;
    createdAt: string;
    updatedAt: string;
  };
};

type ExtraSidebarProps =
  | CommunitySidebarProps
  | TemplateCompactSidebarProps
  | TemplateManageSidebarProps;

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function ExtraSidebar(props: ExtraSidebarProps = { variant: "community" }) {
  if (props.variant === "templateCompact") {
    const seller = props.seller;
    const template = props.template;
    const sellerHref = memberPath(seller.username);

    return (
      <div className="flex w-80 flex-col gap-4 pr-4 text-xs">
        <section className="mt-10 border border-border bg-background/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Template by
          </p>
          <div className="mt-3 space-y-3">
            <Link href={sellerHref} className="block hover:opacity-90 transition-opacity">
              <ProfileSellerIdentity
                name={seller.displayName}
                username={seller.username}
                image={seller.avatarUrl}
                isVerified={seller.isVerified}
                showName={false}
                showStatusBadge={false}
              />
            </Link>

            <div className="space-y-2 border border-border p-3 text-[11px]">
              <p className="text-xs uppercase tracking-wide text-foreground">
                Version & Status
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Version</span>
                <span>{template.version ? `v${template.version}` : "No version yet"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <span className="uppercase">{template.status}</span>
              </div>
            </div>

            {props.canManageTemplate ? (
              <Link
                href={templateEditPath(template.slug)}
                className="inline-flex w-full justify-center border border-border px-3 py-2 text-xs uppercase tracking-wide hover:border-cossistant-orange/40"
              >
                Edit template
              </Link>
            ) : null}
          </div>
        </section>

        <section className="border border-border bg-background/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Explore
          </p>
          <div className="mt-3 flex flex-col gap-2 text-xs">
            {props.discoveryLinks.map((discoveryLink) => (
              <Link
                key={discoveryLink.href}
                href={discoveryLink.href}
                className="hover:underline"
              >
                {discoveryLink.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (props.variant === "templateManage") {
    const seller = props.seller;
    const template = props.template;

    return (
      <div className="flex w-80 flex-col gap-4 pr-4 text-xs">
        <section className="mt-10 border border-border bg-background/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Template Details
          </p>
          <div className="mt-3 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Created By
              </p>
              <ProfileSellerIdentity
                name={seller.displayName}
                username={seller.username}
                image={seller.avatarUrl}
                isVerified={seller.isVerified}
                memberHref={memberPath(seller.username)}
              />
            </div>

            <div className="space-y-2 border border-border p-3 text-[11px]">
              <p className="text-xs uppercase tracking-wide text-foreground">
                Version & Status
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Version</span>
                <span>{template.version ? `v${template.version}` : "No version yet"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <span className="uppercase">{template.status}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(template.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(template.updatedAt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Actions
              </p>
              <TemplateLifecycleSidebarActions
                templateSlug={template.slug}
                templateStatus={template.status}
                editHref={templateEditPath(template.slug)}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  const communitySnapshot = await getCommunitySidebarSnapshotCached({
    limit: COMMUNITY_MEMBER_LIMIT,
  });

  return (
    <div className="flex w-80 flex-col gap-4 pr-4 text-xs">
      <section className="border border-border bg-background/70 p-3 mt-10">
        <p className="text-[11px] tracking-wide text-muted-foreground">
          {communitySnapshot.joinedLast24Hours.toLocaleString()} people joined
          in the last 24 hours
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {communitySnapshot.latestMembers.map((member) => (
            <Link
              key={member.id}
              href={memberPath(member.username)}
              aria-label={`View @${member.username}`}
              className="transition-opacity hover:opacity-80"
            >
              <MemberAvatar
                name={member.name}
                username={member.username}
                image={member.image}
                className="size-8 border-border"
              />
            </Link>
          ))}
        </div>
      </section>
      {/* Temporarily hidden until ad release is ready. */}
      {/* <SidebarAdStack slotCount={SIDEBAR_SLOT_COUNT} /> */}
    </div>
  );
}
