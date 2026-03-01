import Image from "next/image";
import Link from "next/link";
import { Megaphone } from "lucide-react";
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

export function SidebarEmptySlot({
  href = "/advertise",
}: SidebarEmptySlotProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-20 aspect-video flex-col justify-center w-full items-center gap-3 border border-dashed border-border bg-primary/5 px-3 py-3 text-xs transition-colors hover:border-cossistant-orange/40"
    >
      <span className="inline-flex size-8 items-center justify-center border border-border bg-background transition-colors group-hover:border-cossistant-orange/40">
        <Megaphone className="size-4 text-cossistant-orange" />
      </span>
      <span className="leading-tight text-center mt-6">
        <span className="block text-sm uppercase tracking-wide">
          Advertise here
        </span>
        <span className="block text-[11px] text-muted-foreground">
          Get your brand in front of the best power users of the internet.
        </span>
      </span>
    </Link>
  );
}
