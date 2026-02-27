import { getStripeClient } from "@/lib/stripe";
import { getTierConfig } from "./config";
import {
  TIER_ORDER,
  type DiscountTierName,
  type PricingIntegrityReason,
  type PricingSnapshot,
  type TierName,
} from "./types";

const PRICING_CACHE_TTL_MS = 30_000;

let pricingCache:
  | {
      expiresAt: number;
      snapshot: PricingSnapshot;
    }
  | null = null;

let inflightSnapshot: Promise<PricingSnapshot> | null = null;

function clampTaken(value: number, cap: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(Math.floor(value), cap);
}

interface CouponRedemptionLookup {
  count: number;
  failed: boolean;
}

async function getCouponRedemptionLookup(
  couponId: string,
): Promise<CouponRedemptionLookup> {
  const client = getStripeClient();

  try {
    const coupon = await client.coupons.retrieve(couponId);
    if ("deleted" in coupon && coupon.deleted) {
      return { count: 0, failed: true };
    }
    return { count: coupon.times_redeemed ?? 0, failed: false };
  } catch (error) {
    console.error("Failed to fetch coupon redemption count", {
      couponId,
      error,
    });
    return { count: 0, failed: true };
  }
}

function getActiveDiscountTier(
  foundingTaken: number,
  nextTaken: number,
): DiscountTierName | null {
  const foundingCap = getTierConfig("founding").spotsCap;
  const nextCap = getTierConfig("next").spotsCap;

  if (foundingTaken < foundingCap) {
    return "founding";
  }

  if (nextTaken < nextCap) {
    return "next";
  }

  return null;
}

async function buildPricingSnapshot(): Promise<PricingSnapshot> {
  const foundingConfig = getTierConfig("founding");
  const nextConfig = getTierConfig("next");
  const finalConfig = getTierConfig("final");

  if (!foundingConfig.couponId || !nextConfig.couponId) {
    return buildDegradedSnapshot({
      reason: "missing_coupon_config",
      foundingConfig,
      nextConfig,
      finalConfig,
    });
  }

  const [foundingLookup, nextLookup] = await Promise.all([
    getCouponRedemptionLookup(foundingConfig.couponId),
    getCouponRedemptionLookup(nextConfig.couponId),
  ]);

  if (foundingLookup.failed || nextLookup.failed) {
    return buildDegradedSnapshot({
      reason: "stripe_coupon_lookup_failed",
      foundingConfig,
      nextConfig,
      finalConfig,
    });
  }

  const foundingTaken = clampTaken(foundingLookup.count, foundingConfig.spotsCap);
  const nextTaken = clampTaken(nextLookup.count, nextConfig.spotsCap);
  const activeDiscountTier = getActiveDiscountTier(foundingTaken, nextTaken);
  const allowedPlans: TierName[] = activeDiscountTier
    ? [activeDiscountTier]
    : ["final"];

  return buildSnapshot({
    foundingConfig,
    nextConfig,
    finalConfig,
    foundingTaken,
    nextTaken,
    activeDiscountTier,
    allowedPlans,
    integrityStatus: "healthy",
    integrityReason: "ok",
  });
}

function buildDegradedSnapshot(input: {
  reason: PricingIntegrityReason;
  foundingConfig: ReturnType<typeof getTierConfig>;
  nextConfig: ReturnType<typeof getTierConfig>;
  finalConfig: ReturnType<typeof getTierConfig>;
}): PricingSnapshot {
  return buildSnapshot({
    foundingConfig: input.foundingConfig,
    nextConfig: input.nextConfig,
    finalConfig: input.finalConfig,
    foundingTaken: input.foundingConfig.spotsCap,
    nextTaken: input.nextConfig.spotsCap,
    activeDiscountTier: null,
    allowedPlans: ["final"],
    integrityStatus: "degraded",
    integrityReason: input.reason,
  });
}

function buildSnapshot(input: {
  foundingConfig: ReturnType<typeof getTierConfig>;
  nextConfig: ReturnType<typeof getTierConfig>;
  finalConfig: ReturnType<typeof getTierConfig>;
  foundingTaken: number;
  nextTaken: number;
  activeDiscountTier: DiscountTierName | null;
  allowedPlans: TierName[];
  integrityStatus: PricingSnapshot["integrityStatus"];
  integrityReason: PricingSnapshot["integrityReason"];
}): PricingSnapshot {
  const allowedPlanSet = new Set(input.allowedPlans);

  return {
    tiers: {
      founding: {
        ...input.foundingConfig,
        taken: input.foundingTaken,
        remaining: Math.max(
          input.foundingConfig.spotsCap - input.foundingTaken,
          0,
        ),
        selectable: allowedPlanSet.has("founding"),
        isCurrentDiscountTier: input.activeDiscountTier === "founding",
        displayOnlyCap: false,
      },
      next: {
        ...input.nextConfig,
        taken: input.nextTaken,
        remaining: Math.max(input.nextConfig.spotsCap - input.nextTaken, 0),
        selectable: allowedPlanSet.has("next"),
        isCurrentDiscountTier: input.activeDiscountTier === "next",
        displayOnlyCap: false,
      },
      final: {
        ...input.finalConfig,
        taken: 0,
        remaining: input.finalConfig.spotsCap,
        selectable: allowedPlanSet.has("final"),
        isCurrentDiscountTier: input.activeDiscountTier === null,
        displayOnlyCap: true,
      },
    },
    order: TIER_ORDER,
    allowedPlans: input.allowedPlans,
    activeDiscountTier: input.activeDiscountTier,
    integrityStatus: input.integrityStatus,
    integrityReason: input.integrityReason,
    updatedAt: new Date().toISOString(),
  };
}

export async function getPricingSnapshot(
  options: { forceFresh?: boolean } = {},
): Promise<PricingSnapshot> {
  const now = Date.now();

  if (!options.forceFresh && pricingCache && pricingCache.expiresAt > now) {
    return pricingCache.snapshot;
  }

  if (!options.forceFresh && inflightSnapshot) {
    return inflightSnapshot;
  }

  const request = buildPricingSnapshot()
    .then((snapshot) => {
      pricingCache = {
        snapshot,
        expiresAt: Date.now() + PRICING_CACHE_TTL_MS,
      };
      return snapshot;
    })
    .finally(() => {
      inflightSnapshot = null;
    });

  inflightSnapshot = request;

  return request;
}

export function isPlanSelectable(
  snapshot: PricingSnapshot,
  plan: TierName,
): boolean {
  return snapshot.allowedPlans.includes(plan);
}

export function getRecommendedPlan(snapshot: PricingSnapshot): TierName {
  return snapshot.activeDiscountTier ?? "final";
}
