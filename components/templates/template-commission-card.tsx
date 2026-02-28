import { formatUsdFromCents } from "@/lib/money";
import {
  calculateTemplateCommissionSplit,
  DEFAULT_PLATFORM_COMMISSION_RATE,
  DIRECT_REFERRAL_WINDOW_DAYS,
} from "@/lib/templates/commission";

type TemplateCommissionCardProps = {
  priceCents: number;
};

export function TemplateCommissionCard({ priceCents }: TemplateCommissionCardProps) {
  const browsingSplit = calculateTemplateCommissionSplit(priceCents, "browsing");
  const directSplit = calculateTemplateCommissionSplit(priceCents, "direct");

  return (
    <div className="border border-border p-4 space-y-3 text-xs">
      <div className="space-y-1">
        <p className="uppercase tracking-wide text-muted-foreground">Commission</p>
        <p className="text-foreground">
          Price: <strong>{formatUsdFromCents(priceCents)}</strong>
        </p>
      </div>

      <div className="space-y-1">
        <p>
          Platform ({DEFAULT_PLATFORM_COMMISSION_RATE.browsing}%) on marketplace
          browsing sales.
        </p>
        <p className="text-muted-foreground">
          Seller payout: {formatUsdFromCents(browsingSplit.sellerPayoutCents)} (
          {100 - DEFAULT_PLATFORM_COMMISSION_RATE.browsing}%)
        </p>
      </div>

      <div className="space-y-1">
        <p>
          Platform ({DEFAULT_PLATFORM_COMMISSION_RATE.direct}%) on direct-link sales.
        </p>
        <p className="text-muted-foreground">
          Seller payout: {formatUsdFromCents(directSplit.sellerPayoutCents)} (
          {100 - DEFAULT_PLATFORM_COMMISSION_RATE.direct}%)
        </p>
      </div>

      <p className="text-muted-foreground">
        Direct referral attribution is retained for {DIRECT_REFERRAL_WINDOW_DAYS} days.
      </p>
    </div>
  );
}
