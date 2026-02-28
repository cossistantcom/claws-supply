import Image from "next/image";
import Link from "next/link";
import type { RenderableAd } from "@/lib/ads/types";

type SidebarAdSlotProps = {
  ad: RenderableAd;
};

export function SidebarAdSlot({ ad }: SidebarAdSlotProps) {
  return (
    <a
      href={ad.websiteUrl}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className="border border-border bg-primary/5 p-3 flex items-center gap-3 hover:border-cossistant-orange/40 transition-colors"
    >
      <Image
        src={ad.logoUrl}
        alt={`${ad.companyName} logo`}
        width={32}
        height={32}
        className="size-8 border border-border bg-background p-1"
      />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-cossistant-orange">
          Sponsored
        </p>
        <p className="text-xs truncate">{ad.companyName}</p>
      </div>
    </a>
  );
}

type SidebarEmptySlotProps = {
  href?: string;
};

export function SidebarEmptySlot({ href = "/advertise" }: SidebarEmptySlotProps) {
  return (
    <Link
      href={href}
      className="bg-primary/5 border border-dashed border-border flex items-center justify-center w-full h-12 text-xs hover:border-cossistant-orange/40 transition-colors"
    >
      advertise here
    </Link>
  );
}
