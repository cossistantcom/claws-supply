import {
  TIER_ORDER,
  type DiscountTierName,
  type TierConfig,
  type TierName,
} from "./types";

export const DISCOUNT_TIER_ORDER = ["founding", "next"] as const satisfies readonly DiscountTierName[];

const BASE_TIER_CONFIG: Record<TierName, Omit<TierConfig, "couponId">> = {
  founding: {
    name: "founding",
    label: "FUNDING 20",
    monthlyPrice: 299,
    spotsCap: 20,
    badge: "NOW OPEN",
    features: [
      "Dedicated growth engine",
      "Daily qualified leads",
      "Strategy call with founder",
      "Rate locked permanently",
    ],
  },
  next: {
    name: "next",
    label: "NEXT 50",
    monthlyPrice: 449,
    spotsCap: 50,
    badge: null,
    features: [
      "Dedicated growth engine",
      "Daily qualified leads",
      "Strategy call with founder",
      "Priority support",
    ],
  },
  final: {
    name: "final",
    label: "FINAL 50",
    monthlyPrice: 799,
    spotsCap: 50,
    badge: null,
    features: [
      "Dedicated growth engine",
      "Daily qualified leads",
      "Strategy call with founder",
      "Priority support",
      "Custom integrations",
    ],
  },
};

const COUPON_IDS: Record<TierName, string | null> = {
  founding: process.env.STRIPE_COUPON_FOUNDING || null,
  next: process.env.STRIPE_COUPON_NEXT || null,
  final: null,
};

export const TIER_CONFIG: Record<TierName, TierConfig> = {
  founding: { ...BASE_TIER_CONFIG.founding, couponId: COUPON_IDS.founding },
  next: { ...BASE_TIER_CONFIG.next, couponId: COUPON_IDS.next },
  final: { ...BASE_TIER_CONFIG.final, couponId: COUPON_IDS.final },
};

export function getTierConfig(name: TierName): TierConfig {
  return TIER_CONFIG[name];
}

export function getCheckoutPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID is required");
  }
  return priceId;
}

export function getBetterAuthPlans() {
  const priceId = getCheckoutPriceId();
  return TIER_ORDER.map((name) => ({
    name,
    priceId,
  }));
}
