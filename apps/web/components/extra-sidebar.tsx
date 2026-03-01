import Link from "next/link";
import { MemberAvatar } from "@/components/members/member-avatar";
import { SidebarAdSlot, SidebarEmptySlot } from "@/components/ads/sidebar-ad-slot";
import { getAdAvailability, listRenderableSidebarAds } from "@/lib/ads/read-service";
import { getCommunitySidebarSnapshotCached } from "@/lib/members/read-service";
import { memberPath } from "@/lib/routes";

const SIDEBAR_SLOT_COUNT = 5;
const COMMUNITY_MEMBER_LIMIT = 10;

export async function ExtraSidebar() {
  const [communitySnapshot, ads, availability] = await Promise.all([
    getCommunitySidebarSnapshotCached({
      limit: COMMUNITY_MEMBER_LIMIT,
    }),
    listRenderableSidebarAds({
      limit: SIDEBAR_SLOT_COUNT,
    }),
    getAdAvailability(),
  ]);
  const shouldShowScarcity = availability.spotsLeft < 10;

  return (
    <div className="flex w-80 flex-col gap-4 pr-4 text-xs">
      <section className="border border-border bg-background/70 p-3">
        <p className="text-[11px] tracking-wide text-muted-foreground">
          {communitySnapshot.joinedLast24Hours.toLocaleString()} people joined in the
          last 24 hours
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
      {shouldShowScarcity ? (
        <Link
          href="/advertise"
          className="border border-cossistant-orange/40 bg-cossistant-orange/10 px-3 py-2 text-[11px] tracking-wide text-cossistant-orange transition-colors hover:bg-cossistant-orange/15"
        >
          Only {availability.spotsLeft} ad spots left ({availability.spotsLeft}/
          {availability.slotLimit})
        </Link>
      ) : null}
      {ads.map((ad) => (
        <SidebarAdSlot key={ad.id} ad={ad} />
      ))}
      {ads.length < SIDEBAR_SLOT_COUNT ? <SidebarEmptySlot key="empty-cta" /> : null}
    </div>
  );
}
