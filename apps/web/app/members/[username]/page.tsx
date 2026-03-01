import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemberAvatar } from "@/components/members/member-avatar";
import { OpenClawPageShell } from "@/components/openclaw-page-shell";
import { TemplateFeedGrid } from "@/components/template-feed-grid";
import { getPublicMemberByUsernameCached } from "@/lib/members/read-service";
import { memberPath, membersPath } from "@/lib/routes";
import { buildSeoMetadata } from "@/lib/seo";
import { listPublishedTemplatesBySellerCached } from "@/lib/templates/read-service";

export const dynamic = "force-dynamic";

const MEMBER_TEMPLATE_LIMIT = 24;

type MemberRouteParams = {
  username: string;
};

type MemberPageProps = {
  params: Promise<MemberRouteParams>;
};

function getMemberDescription(input: { name: string; username: string; bio: string | null }) {
  if (input.bio && input.bio.trim().length > 0) {
    return input.bio;
  }

  return `View @${input.username}'s public Claws.supply profile and published OpenClaw templates.`;
}

export async function generateMetadata({
  params,
}: MemberPageProps): Promise<Metadata> {
  const { username } = await params;
  const member = await getPublicMemberByUsernameCached(username);

  if (!member) {
    return buildSeoMetadata({
      title: "Member Not Found — Claws.supply",
      description: "This member profile does not exist.",
      path: membersPath(),
      noindex: true,
    });
  }

  return buildSeoMetadata({
    title: `${member.name} (@${member.username}) — Members — Claws.supply`,
    description: getMemberDescription(member),
    path: memberPath(member.username),
  });
}

export default async function MemberProfilePage({ params }: MemberPageProps) {
  const { username } = await params;
  const member = await getPublicMemberByUsernameCached(username);

  if (!member) {
    notFound();
  }

  const templatesResult = await listPublishedTemplatesBySellerCached({
    sellerId: member.id,
    sort: "newest",
    page: 1,
    limit: MEMBER_TEMPLATE_LIMIT,
  });

  const verificationChecklist = [
    {
      id: "twitter",
      label: "Verified twitter profile",
      completed: member.hasVerifiedTwitterProfile,
    },
    {
      id: "stripe",
      label: "Verified identity via Stripe",
      completed: member.hasVerifiedStripeIdentity,
    },
  ];

  return (
    <main className="min-h-screen px-6 pb-16 pt-24 md:px-0">
      <OpenClawPageShell contentClassName="w-full max-w-4xl space-y-8">
        <header className="space-y-4 border-b border-border pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Member Profile
              </p>
              <div className="flex items-center gap-4">
                <MemberAvatar
                  name={member.name}
                  username={member.username}
                  image={member.image}
                  className="size-14"
                />
                <div>
                  <h1 className="text-3xl sm:text-4xl">{member.name}</h1>
                  <p className="text-sm text-muted-foreground">@{member.username}</p>
                </div>
              </div>
            </div>
            <span
              className={[
                "border px-3 py-1 text-xs uppercase tracking-wide",
                member.isVerified
                  ? "border-cossistant-green/40 text-cossistant-green"
                  : "border-border text-muted-foreground",
              ].join(" ")}
            >
              {member.isVerified ? "VERIFIED" : "NOT VERIFIED"}
            </span>
          </div>

          {member.bio ? (
            <p className="max-w-3xl text-sm text-muted-foreground">{member.bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No bio shared yet.</p>
          )}

          <div className="space-y-2 pt-1">
            {verificationChecklist.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 text-sm text-foreground/90"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  aria-label={item.label}
                  className="size-4 rounded-none border border-border accent-primary"
                />
                <span className={item.completed ? "" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
          <Link
            href={membersPath()}
            className="inline-block text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            Back to members
          </Link>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl">Published Templates</h2>
            <p className="text-xs text-muted-foreground">
              {templatesResult.total.toLocaleString()} published
            </p>
          </div>
          {templatesResult.items.length > 0 ? (
            <TemplateFeedGrid templates={templatesResult.items} showCategory />
          ) : (
            <div className="border border-border p-4 text-sm text-muted-foreground">
              This member has not published templates yet.
            </div>
          )}
        </section>
      </OpenClawPageShell>
    </main>
  );
}
