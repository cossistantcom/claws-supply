import Stripe from "stripe";

// ─── Stripe Client ──────────────────────────────────────
// Lazily initialised so the module can be imported during Next.js static
// page-data collection when env vars are not yet available.

let _stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripeClient) {
    _stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripeClient;
}

// ─── Pricing ────────────────────────────────────────────
// One base price ($799/mo). Two coupons discount earlier tiers.

/** The single recurring price created in Stripe */
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;

// ─── Tier Definitions ───────────────────────────────────

export type TierName = "founding" | "next" | "final";

export interface TierConfig {
  name: TierName;
  label: string;
  price: number;
  spots: number;
  active: boolean;
  /** Stripe coupon ID applied at checkout. `null` = full price. */
  couponId: string | null;
}

const tiers: Record<TierName, TierConfig> = {
  founding: {
    name: "founding",
    label: "FOUNDING 50",
    price: 299,
    spots: 50,
    active: true,
    couponId: process.env.STRIPE_COUPON_FOUNDING || null,
  },
  next: {
    name: "next",
    label: "NEXT 50",
    price: 449,
    spots: 50,
    active: false,
    couponId: process.env.STRIPE_COUPON_NEXT || null,
  },
  final: {
    name: "final",
    label: "FINAL 50",
    price: 799,
    spots: 50,
    active: false,
    couponId: null, // full price
  },
};

export const TIERS = tiers;

export const TIER_LIST: TierConfig[] = [
  tiers.founding,
  tiers.next,
  tiers.final,
];

/** Get a tier config by name. Throws if not found. */
export function getTier(name: TierName): TierConfig {
  const tier = tiers[name];
  if (!tier) throw new Error(`Unknown tier: ${name}`);
  return tier;
}

/** Better Auth subscription.plans format — all tiers share the same priceId */
export function getBetterAuthPlans() {
  return TIER_LIST.map((t) => ({
    name: t.name,
    priceId: STRIPE_PRICE_ID,
  }));
}
