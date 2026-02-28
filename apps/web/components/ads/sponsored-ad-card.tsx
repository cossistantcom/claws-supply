import Image from "next/image";
import type { RenderableAd } from "@/lib/ads/types";

type SponsoredAdCardProps = {
  ad: RenderableAd;
};

export function SponsoredAdCard({ ad }: SponsoredAdCardProps) {
  return (
    <article className="border border-cossistant-orange/30 bg-cossistant-orange/5 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] tracking-wide uppercase text-cossistant-orange">
          Sponsored
        </p>
        <a
          href={ad.websiteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="text-[11px] hover:underline"
        >
          Visit
        </a>
      </div>

      <div className="flex items-center gap-3">
        <Image
          src={ad.logoUrl}
          alt={`${ad.companyName} logo`}
          width={40}
          height={40}
          className="size-10 border border-border bg-background p-1"
        />
        <h3 className="text-base leading-tight">{ad.companyName}</h3>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{ad.shortDescription}</p>
    </article>
  );
}
