import Link from "next/link";
import {
  SidebarAdSlot,
  SidebarEmptySlot,
} from "@/components/ads/sidebar-ad-slot";
import {
  getAdAvailability,
  listRenderableSidebarAds,
} from "@/lib/ads/read-service";
import { cn } from "@/lib/utils";
import type { AdAvailabilityDTO, RenderableAd } from "@/lib/ads/types";

type SidebarAdStackProps = {
  slotCount?: number;
  className?: string;
};

export async function SidebarAdStack({
  slotCount = 5,
  className,
}: SidebarAdStackProps) {
  let ads: RenderableAd[] = [];
  let availability: AdAvailabilityDTO | null = null;

  try {
    [ads, availability] = await Promise.all([
      listRenderableSidebarAds({
        limit: slotCount,
      }),
      getAdAvailability(),
    ]);
  } catch {
    ads = [];
    availability = null;
  }

  const shouldShowScarcity = Boolean(availability && availability.spotsLeft < 10);

  return (
    <div className={cn("flex flex-col gap-4 text-xs", className)}>
      {shouldShowScarcity && availability ? (
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
      {ads.length < slotCount ? <SidebarEmptySlot /> : null}
    </div>
  );
}
