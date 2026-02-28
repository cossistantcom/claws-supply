import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { PublicTemplateCard } from "@/lib/templates/public-types";
import {
  AD_PLAN_PRICING_CENTS,
  AD_RESULTS_INSERT_EVERY,
  AD_RESULTS_MAX_INSERTIONS,
  AD_SLOT_LIMIT,
  getResolvedStripeAdPriceIds,
  resolveStripePriceEnvironment,
} from "./constants";
import { db } from "@/lib/db";
import { adCampaign } from "@/lib/db/schema";
import {
  buildCapacityReservationWhere,
  buildRenderableCampaignWhere,
} from "./domain";
import type { AdAvailabilityDTO, AdCampaignDTO, RenderableAd } from "./types";

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function isUndefinedTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    cause?: {
      code?: string;
    };
  };

  return candidate.code === "42P01" || candidate.cause?.code === "42P01";
}

export function mapAdCampaignDTO(row: {
  id: string;
  advertiserUserId: string;
  companyName: string;
  websiteUrl: string;
  shortDescription: string;
  logoUrl: string;
  placement: "sidebar" | "results" | "both";
  status:
    | "checkout_pending"
    | "active"
    | "cancel_scheduled"
    | "ended"
    | "canceled"
    | "suspended_policy";
  stripeSubscriptionStatus: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AdCampaignDTO {
  return {
    id: row.id,
    advertiserUserId: row.advertiserUserId,
    companyName: row.companyName,
    websiteUrl: row.websiteUrl,
    shortDescription: row.shortDescription,
    logoUrl: row.logoUrl,
    placement: row.placement,
    status: row.status,
    stripeSubscriptionStatus: row.stripeSubscriptionStatus,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodStart: toIso(row.currentPeriodStart),
    currentPeriodEnd: toIso(row.currentPeriodEnd),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapRenderableAd(row: {
  id: string;
  companyName: string;
  websiteUrl: string;
  shortDescription: string;
  logoUrl: string;
  placement: "sidebar" | "results" | "both";
}): RenderableAd {
  return {
    id: row.id,
    companyName: row.companyName,
    websiteUrl: row.websiteUrl,
    shortDescription: row.shortDescription,
    logoUrl: row.logoUrl,
    placement: row.placement,
  };
}

export async function listRenderableSidebarAds(options?: {
  limit?: number;
}): Promise<RenderableAd[]> {
  try {
    const now = new Date();
    const rows = await db
      .select({
        id: adCampaign.id,
        companyName: adCampaign.companyName,
        websiteUrl: adCampaign.websiteUrl,
        shortDescription: adCampaign.shortDescription,
        logoUrl: adCampaign.logoUrl,
        placement: adCampaign.placement,
      })
      .from(adCampaign)
      .where(
        and(
          buildRenderableCampaignWhere(now),
          inArray(adCampaign.placement, ["sidebar", "both"]),
        ),
      )
      .orderBy(asc(adCampaign.createdAt))
      .limit(options?.limit ?? 5);

    return rows.map(mapRenderableAd);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function listRenderableResultsAds(options?: {
  limit?: number;
}): Promise<RenderableAd[]> {
  try {
    const now = new Date();
    const rows = await db
      .select({
        id: adCampaign.id,
        companyName: adCampaign.companyName,
        websiteUrl: adCampaign.websiteUrl,
        shortDescription: adCampaign.shortDescription,
        logoUrl: adCampaign.logoUrl,
        placement: adCampaign.placement,
      })
      .from(adCampaign)
      .where(
        and(
          buildRenderableCampaignWhere(now),
          inArray(adCampaign.placement, ["results", "both"]),
        ),
      )
      .orderBy(asc(adCampaign.createdAt))
      .limit(options?.limit ?? AD_RESULTS_MAX_INSERTIONS);

    return rows.map(mapRenderableAd);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function getAdAvailability(): Promise<AdAvailabilityDTO> {
  let occupiedSlots = 0;
  try {
    const now = new Date();
    occupiedSlots = await db.$count(adCampaign, buildCapacityReservationWhere(now));
  } catch (error) {
    if (!isUndefinedTableError(error)) {
      throw error;
    }
  }
  const spotsLeft = Math.max(AD_SLOT_LIMIT - occupiedSlots, 0);
  const priceEnvironment = resolveStripePriceEnvironment();
  const priceIds = getResolvedStripeAdPriceIds();

  return {
    slotLimit: AD_SLOT_LIMIT,
    occupiedSlots,
    spotsLeft,
    pricing: { ...AD_PLAN_PRICING_CENTS },
    stripePriceIds: {
      environment: priceEnvironment,
      values: {
        ...priceIds[priceEnvironment],
      },
    },
  };
}

export async function getCampaignByUserId(userId: string): Promise<AdCampaignDTO | null> {
  let row:
    | {
        id: string;
        advertiserUserId: string;
        companyName: string;
        websiteUrl: string;
        shortDescription: string;
        logoUrl: string;
        placement: "sidebar" | "results" | "both";
        status:
          | "checkout_pending"
          | "active"
          | "cancel_scheduled"
          | "ended"
          | "canceled"
          | "suspended_policy";
        stripeSubscriptionStatus: string | null;
        cancelAtPeriodEnd: boolean;
        currentPeriodStart: Date | null;
        currentPeriodEnd: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined;

  try {
    [row] = await db
      .select({
        id: adCampaign.id,
        advertiserUserId: adCampaign.advertiserUserId,
        companyName: adCampaign.companyName,
        websiteUrl: adCampaign.websiteUrl,
        shortDescription: adCampaign.shortDescription,
        logoUrl: adCampaign.logoUrl,
        placement: adCampaign.placement,
        status: adCampaign.status,
        stripeSubscriptionStatus: adCampaign.stripeSubscriptionStatus,
        cancelAtPeriodEnd: adCampaign.cancelAtPeriodEnd,
        currentPeriodStart: adCampaign.currentPeriodStart,
        currentPeriodEnd: adCampaign.currentPeriodEnd,
        createdAt: adCampaign.createdAt,
        updatedAt: adCampaign.updatedAt,
      })
      .from(adCampaign)
      .where(eq(adCampaign.advertiserUserId, userId))
      .orderBy(desc(adCampaign.updatedAt), desc(adCampaign.createdAt))
      .limit(1);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      return null;
    }
    throw error;
  }

  return row ? mapAdCampaignDTO(row) : null;
}

export type SponsoredTemplateFeedItem =
  | {
      type: "template";
      template: PublicTemplateCard;
      key: string;
    }
  | {
      type: "ad";
      ad: RenderableAd;
      key: string;
    };

export function buildSponsoredTemplateFeed(options: {
  templates: PublicTemplateCard[];
  sponsoredAds: RenderableAd[];
  insertEvery?: number;
  maxInsertions?: number;
}): SponsoredTemplateFeedItem[] {
  const insertEvery = options.insertEvery ?? AD_RESULTS_INSERT_EVERY;
  const maxInsertions = options.maxInsertions ?? AD_RESULTS_MAX_INSERTIONS;

  if (insertEvery <= 0 || maxInsertions <= 0 || options.sponsoredAds.length === 0) {
    return options.templates.map((template) => ({
      type: "template",
      template,
      key: `template-${template.id}`,
    }));
  }

  const output: SponsoredTemplateFeedItem[] = [];
  let templatesSeen = 0;
  let adIndex = 0;
  let insertions = 0;

  for (const templateRow of options.templates) {
    output.push({
      type: "template",
      template: templateRow,
      key: `template-${templateRow.id}`,
    });
    templatesSeen += 1;

    if (
      templatesSeen % insertEvery === 0 &&
      insertions < maxInsertions &&
      adIndex < options.sponsoredAds.length
    ) {
      const adRow = options.sponsoredAds[adIndex];
      if (adRow) {
        output.push({
          type: "ad",
          ad: adRow,
          key: `sponsored-${adRow.id}-${insertions}`,
        });
      }
      adIndex += 1;
      insertions += 1;
    }
  }

  return output;
}
