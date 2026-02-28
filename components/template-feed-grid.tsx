import { SponsoredAdCard } from "@/components/ads/sponsored-ad-card";
import { TemplateCard } from "@/components/template-card";
import { buildSponsoredTemplateFeed } from "@/lib/ads/read-service";
import type { RenderableAd } from "@/lib/ads/types";
import type { PublicTemplateCard } from "@/lib/templates/public-types";

type TemplateFeedGridProps = {
  templates: PublicTemplateCard[];
  sponsoredAds?: RenderableAd[];
  showCategory?: boolean;
};

export function TemplateFeedGrid({
  templates,
  sponsoredAds = [],
  showCategory = false,
}: TemplateFeedGridProps) {
  const feed = buildSponsoredTemplateFeed({
    templates,
    sponsoredAds,
  });

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {feed.map((item) =>
        item.type === "template" ? (
          <TemplateCard
            key={item.key}
            template={item.template}
            showCategory={showCategory}
          />
        ) : (
          <SponsoredAdCard key={item.key} ad={item.ad} />
        ),
      )}
    </section>
  );
}

