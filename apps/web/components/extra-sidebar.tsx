import Link from "next/link";
import { MemberAvatar } from "@/components/members/member-avatar";
import { SidebarAdStack } from "@/components/ads/sidebar-ad-stack";
import { getCommunitySidebarSnapshotCached } from "@/lib/members/read-service";
import { memberPath } from "@/lib/routes";

const SIDEBAR_SLOT_COUNT = 5;
const COMMUNITY_MEMBER_LIMIT = 10;

export async function ExtraSidebar() {
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
      <SidebarAdStack slotCount={SIDEBAR_SLOT_COUNT} />
    </div>
  );
}
