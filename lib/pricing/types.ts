export const TIER_ORDER = ["founding", "next", "final"] as const;

export type TierName = (typeof TIER_ORDER)[number];
export type DiscountTierName = Exclude<TierName, "final">;

export interface TierDisplayConfig {
  name: TierName;
  label: string;
  monthlyPrice: number;
  spotsCap: number;
  badge: string | null;
  features: string[];
}

export interface TierConfig extends TierDisplayConfig {
  couponId: string | null;
}

export interface TierSnapshot extends TierDisplayConfig {
  taken: number;
  remaining: number;
  selectable: boolean;
  isCurrentDiscountTier: boolean;
  displayOnlyCap: boolean;
}

export type PricingIntegrityStatus = "healthy" | "degraded";

export type PricingIntegrityReason =
  | "ok"
  | "missing_coupon_config"
  | "stripe_coupon_lookup_failed";

export interface PricingSnapshot {
  tiers: Record<TierName, TierSnapshot>;
  order: readonly TierName[];
  allowedPlans: TierName[];
  activeDiscountTier: DiscountTierName | null;
  integrityStatus: PricingIntegrityStatus;
  integrityReason: PricingIntegrityReason;
  updatedAt: string;
}
