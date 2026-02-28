import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { adCampaign } from "@/lib/db/schema";

export const AD_LIVE_STATUSES = [
  "checkout_pending",
  "active",
  "cancel_scheduled",
] as const;

export const AD_RENDERABLE_STATUSES = ["active", "cancel_scheduled"] as const;

export const AD_FINAL_NON_ACTIVE_STRIPE_SUBSCRIPTION_STATUSES = [
  "canceled",
  "unpaid",
  "incomplete_expired",
] as const;

export function buildRenderableCampaignWhere(now: Date) {
  return and(
    inArray(adCampaign.status, AD_RENDERABLE_STATUSES),
    isNull(adCampaign.suspendedAt),
    gt(adCampaign.currentPeriodEnd, now),
  )!;
}

export function buildCapacityReservationWhere(now: Date) {
  return or(
    inArray(adCampaign.status, ["active", "cancel_scheduled"]),
    and(eq(adCampaign.status, "checkout_pending"), gt(adCampaign.checkoutExpiresAt, now)),
  )!;
}

