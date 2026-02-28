import Link from "next/link";
import { SidebarAdSlot, SidebarEmptySlot } from "@/components/ads/sidebar-ad-slot";
import { getAdAvailability, listRenderableSidebarAds } from "@/lib/ads/read-service";

const SIDEBAR_SLOT_COUNT = 5;

export async function ExtraSidebar() {
  const [ads, availability] = await Promise.all([
    listRenderableSidebarAds({
      limit: SIDEBAR_SLOT_COUNT,
    }),
    getAdAvailability(),
  ]);
  const shouldShowScarcity = availability.spotsLeft < 10;

  return (
    <div className="flex w-80 flex-col gap-4 pr-4 text-xs">
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
