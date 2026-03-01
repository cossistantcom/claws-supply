import { randomUUID } from "node:crypto";
import { and, eq, inArray, lt } from "drizzle-orm";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { db } from "@/lib/db";
import { adCampaign, stripeWebhookEvent, user } from "@/lib/db/schema";
import {
  AD_CHECKOUT_PENDING_TTL_MINUTES,
  AD_SLOT_LIMIT,
  getResolvedStripeAdPriceIds,
  resolveStripePriceEnvironment,
} from "./constants";
import {
  AD_FINAL_NON_ACTIVE_STRIPE_SUBSCRIPTION_STATUSES,
  AD_LIVE_STATUSES,
  buildCapacityReservationWhere,
} from "./domain";
import { AdsServiceError } from "./errors";
import { getCampaignByUserId, mapAdCampaignDTO } from "./read-service";
import type { CreateAdCampaignInput } from "./schemas";
import type {
  AdCampaignDTO,
  CancelAdCampaignResponse,
  CreateAdCampaignResponse,
} from "./types";
import { verifyAdLogoExistsAndMetadata } from "./blob";

type StripeUserRow = {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
};

function isUniqueViolation(error: unknown, constraintName: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    constraint?: string;
    cause?: {
      code?: string;
      constraint?: string;
    };
  };

  if (candidate.code === "23505" && candidate.constraint === constraintName) {
    return true;
  }

  return (
    candidate.cause?.code === "23505" &&
    candidate.cause?.constraint === constraintName
  );
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function getCheckoutExpiresAt(now: Date) {
  return new Date(now.getTime() + AD_CHECKOUT_PENDING_TTL_MINUTES * 60 * 1000);
}

function toDateFromUnixSeconds(value: number | null | undefined): Date | null {
  if (!value || value <= 0) {
    return null;
  }

  return new Date(value * 1000);
}

function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
} {
  const item = subscription.items.data[0];

  return {
    currentPeriodStart: toDateFromUnixSeconds(item?.current_period_start),
    currentPeriodEnd: toDateFromUnixSeconds(item?.current_period_end),
  };
}

function resolvePriceIdForPlacement(
  placement: CreateAdCampaignInput["placement"],
): string {
  const env = resolveStripePriceEnvironment();
  const prices = getResolvedStripeAdPriceIds();
  return prices[env][placement];
}

function isFinalNonActiveStripeSubscriptionStatus(status: string): boolean {
  return (
    AD_FINAL_NON_ACTIVE_STRIPE_SUBSCRIPTION_STATUSES as readonly string[]
  ).includes(status);
}

function resolveCampaignStatusFromSubscription(options: {
  currentStatus:
    | "checkout_pending"
    | "active"
    | "cancel_scheduled"
    | "ended"
    | "canceled"
    | "suspended_policy";
  stripeStatus: string;
  cancelAtPeriodEnd: boolean;
}): "active" | "cancel_scheduled" | "ended" | "suspended_policy" {
  if (options.currentStatus === "suspended_policy") {
    return "suspended_policy";
  }

  if (isFinalNonActiveStripeSubscriptionStatus(options.stripeStatus)) {
    return "ended";
  }

  if (options.cancelAtPeriodEnd) {
    return "cancel_scheduled";
  }

  return "active";
}

async function getStripeUserRow(userId: string): Promise<StripeUserRow> {
  const [row] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      stripeCustomerId: user.stripeCustomerId,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new AdsServiceError("User not found.", {
      code: "USER_NOT_FOUND",
      status: 404,
    });
  }

  return row;
}

async function ensureStripeCustomerId(row: StripeUserRow): Promise<string> {
  if (row.stripeCustomerId) {
    return row.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: row.email,
    name: row.name,
    metadata: {
      userId: row.id,
    },
  });

  await db
    .update(user)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(user.id, row.id));

  return customer.id;
}

export async function cleanupExpiredCheckoutPendingCampaigns(now = new Date()) {
  await db
    .update(adCampaign)
    .set({
      status: "canceled",
      canceledAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(adCampaign.status, "checkout_pending"),
        lt(adCampaign.checkoutExpiresAt, now),
      ),
    );
}

async function findLiveCampaignByUserId(userId: string) {
  const [row] = await db
    .select({
      id: adCampaign.id,
      status: adCampaign.status,
    })
    .from(adCampaign)
    .where(
      and(
        eq(adCampaign.advertiserUserId, userId),
        inArray(adCampaign.status, AD_LIVE_STATUSES),
      ),
    )
    .limit(1);

  return row ?? null;
}

async function findCampaignByCheckoutSessionId(checkoutSessionId: string) {
  const [row] = await db
    .select({
      id: adCampaign.id,
      status: adCampaign.status,
    })
    .from(adCampaign)
    .where(eq(adCampaign.stripeCheckoutSessionId, checkoutSessionId))
    .limit(1);

  return row ?? null;
}

async function findCampaignBySubscriptionId(subscriptionId: string) {
  const [row] = await db
    .select({
      id: adCampaign.id,
      status: adCampaign.status,
    })
    .from(adCampaign)
    .where(eq(adCampaign.stripeSubscriptionId, subscriptionId))
    .limit(1);

  return row ?? null;
}

function getBaseUrl(baseUrl: string) {
  const normalized = normalizeUrl(baseUrl);

  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    throw new AdsServiceError("Invalid base URL.", {
      code: "INVALID_BASE_URL",
      status: 400,
    });
  }

  return normalized;
}

async function assertCapacityAvailable(options: {
  now: Date;
  hasExistingPendingCampaign: boolean;
}) {
  if (options.hasExistingPendingCampaign) {
    return;
  }

  const occupiedSlots = await db.$count(
    adCampaign,
    buildCapacityReservationWhere(options.now),
  );

  if (occupiedSlots >= AD_SLOT_LIMIT) {
    throw new AdsServiceError("All advertising slots are currently occupied.", {
      code: "SLOTS_FULL",
      status: 409,
    });
  }
}

async function upsertPendingCampaign(options: {
  userId: string;
  input: CreateAdCampaignInput;
  checkoutExpiresAt: Date;
  stripePriceId: string;
  logo: Awaited<ReturnType<typeof verifyAdLogoExistsAndMetadata>>;
}) {
  const now = new Date();
  const existingLiveCampaign = await findLiveCampaignByUserId(options.userId);

  if (existingLiveCampaign && existingLiveCampaign.status !== "checkout_pending") {
    throw new AdsServiceError(
      "You already have an active advertising campaign. Cancel it before creating a new one.",
      {
        code: "CAMPAIGN_ALREADY_ACTIVE",
        status: 409,
      },
    );
  }

  await assertCapacityAvailable({
    now,
    hasExistingPendingCampaign: existingLiveCampaign?.status === "checkout_pending",
  });

  const values = {
    advertiserUserId: options.userId,
    companyName: options.input.companyName,
    websiteUrl: options.input.websiteUrl,
    shortDescription: options.input.shortDescription,
    logoUrl: options.logo.url,
    logoObjectKey: options.logo.pathname,
    placement: options.input.placement,
    stripePriceId: options.stripePriceId,
    status: "checkout_pending" as const,
    checkoutExpiresAt: options.checkoutExpiresAt,
    canceledAt: null,
    suspendedAt: null,
    suspendedReason: null,
    updatedAt: now,
  };

  if (existingLiveCampaign?.status === "checkout_pending") {
    const [updated] = await db
      .update(adCampaign)
      .set(values)
      .where(eq(adCampaign.id, existingLiveCampaign.id))
      .returning({
        id: adCampaign.id,
      });

    if (!updated) {
      throw new AdsServiceError("Unable to refresh pending campaign.", {
        code: "CAMPAIGN_UPDATE_FAILED",
        status: 500,
      });
    }

    return updated.id;
  }

  try {
    const [inserted] = await db
      .insert(adCampaign)
      .values({
        id: randomUUID(),
        ...values,
        createdAt: now,
      })
      .returning({
        id: adCampaign.id,
      });

    if (!inserted) {
      throw new AdsServiceError("Unable to create pending campaign.", {
        code: "CAMPAIGN_CREATE_FAILED",
        status: 500,
      });
    }

    return inserted.id;
  } catch (error) {
    if (isUniqueViolation(error, "ad_campaign_live_user_unique")) {
      throw new AdsServiceError(
        "You already have an active advertising campaign. Cancel it before creating a new one.",
        {
          code: "CAMPAIGN_ALREADY_ACTIVE",
          status: 409,
        },
      );
    }

    throw error;
  }
}

function requireStripePlatformWebhookSecret() {
  const secret = process.env.STRIPE_PLATFORM_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new AdsServiceError("Missing Stripe platform webhook secret.", {
      code: "WEBHOOK_SECRET_MISSING",
      status: 500,
    });
  }

  return secret;
}

async function markWebhookEventProcessed(event: Stripe.Event): Promise<boolean> {
  try {
    await db.insert(stripeWebhookEvent).values({
      eventId: event.id,
      eventType: event.type,
      processedAt: new Date(),
    });
    return true;
  } catch (error) {
    if (isUniqueViolation(error, "stripe_webhook_event_pkey")) {
      return false;
    }

    throw error;
  }
}

async function updateCampaignFromSubscription(options: {
  campaignId: string;
  currentCampaignStatus:
    | "checkout_pending"
    | "active"
    | "cancel_scheduled"
    | "ended"
    | "canceled"
    | "suspended_policy";
  subscription: Stripe.Subscription;
}) {
  const now = new Date();
  const nextStatus = resolveCampaignStatusFromSubscription({
    currentStatus: options.currentCampaignStatus,
    stripeStatus: options.subscription.status,
    cancelAtPeriodEnd: Boolean(options.subscription.cancel_at_period_end),
  });
  const period = getSubscriptionPeriod(options.subscription);

  await db
    .update(adCampaign)
    .set({
      status: nextStatus,
      stripeSubscriptionStatus: options.subscription.status,
      cancelAtPeriodEnd: Boolean(options.subscription.cancel_at_period_end),
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      canceledAt: nextStatus === "ended" ? now : null,
      updatedAt: now,
    })
    .where(eq(adCampaign.id, options.campaignId));
}

function getResourceId(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }

  return null;
}

export async function createAdCampaignCheckout(options: {
  userId: string;
  input: CreateAdCampaignInput;
  baseUrl: string;
}): Promise<CreateAdCampaignResponse> {
  const now = new Date();
  await cleanupExpiredCheckoutPendingCampaigns(now);

  const logo = await verifyAdLogoExistsAndMetadata({
    pathname: options.input.logoUpload.pathname,
    userId: options.userId,
  });

  const stripePriceId = resolvePriceIdForPlacement(options.input.placement);
  const checkoutExpiresAt = getCheckoutExpiresAt(now);
  const campaignId = await upsertPendingCampaign({
    userId: options.userId,
    input: options.input,
    checkoutExpiresAt,
    stripePriceId,
    logo,
  });

  const stripe = getStripeClient();
  const stripeUser = await getStripeUserRow(options.userId);
  const customerId = await ensureStripeCustomerId(stripeUser);
  const appBaseUrl = getBaseUrl(options.baseUrl);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${appBaseUrl}/advertise?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appBaseUrl}/advertise?checkout=cancel`,
    expires_at: Math.floor(checkoutExpiresAt.getTime() / 1000),
    metadata: {
      adCampaignId: campaignId,
      userId: options.userId,
      placement: options.input.placement,
    },
    subscription_data: {
      metadata: {
        adCampaignId: campaignId,
        userId: options.userId,
        placement: options.input.placement,
      },
    },
  });

  await db
    .update(adCampaign)
    .set({
      stripeCustomerId: customerId,
      stripeCheckoutSessionId: checkoutSession.id,
      updatedAt: new Date(),
    })
    .where(eq(adCampaign.id, campaignId));

  const campaign = await getCampaignByUserId(options.userId);
  if (!campaign) {
    throw new AdsServiceError("Unable to load campaign after checkout creation.", {
      code: "CAMPAIGN_FETCH_FAILED",
      status: 500,
    });
  }

  if (!checkoutSession.url) {
    throw new AdsServiceError("Stripe checkout URL is unavailable.", {
      code: "CHECKOUT_URL_MISSING",
      status: 500,
    });
  }

  return {
    campaign,
    checkoutUrl: checkoutSession.url,
  };
}

export async function cancelAdCampaignForUser(userId: string): Promise<CancelAdCampaignResponse> {
  await cleanupExpiredCheckoutPendingCampaigns();

  const [campaignRow] = await db
    .select({
      id: adCampaign.id,
      stripeSubscriptionId: adCampaign.stripeSubscriptionId,
      status: adCampaign.status,
    })
    .from(adCampaign)
    .where(
      and(
        eq(adCampaign.advertiserUserId, userId),
        inArray(adCampaign.status, ["active", "cancel_scheduled"]),
      ),
    )
    .limit(1);

  if (!campaignRow) {
    throw new AdsServiceError("No active advertising campaign to cancel.", {
      code: "CAMPAIGN_NOT_FOUND",
      status: 404,
    });
  }

  if (!campaignRow.stripeSubscriptionId) {
    throw new AdsServiceError("Campaign subscription is missing.", {
      code: "SUBSCRIPTION_MISSING",
      status: 500,
    });
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.update(campaignRow.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const now = new Date();
  const nextStatus = resolveCampaignStatusFromSubscription({
    currentStatus: campaignRow.status,
    stripeStatus: subscription.status,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
  const period = getSubscriptionPeriod(subscription);

  await db
    .update(adCampaign)
    .set({
      status: nextStatus,
      stripeSubscriptionStatus: subscription.status,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      updatedAt: now,
    })
    .where(eq(adCampaign.id, campaignRow.id));

  const campaign = await getCampaignByUserId(userId);
  if (!campaign) {
    throw new AdsServiceError("Unable to load campaign.", {
      code: "CAMPAIGN_FETCH_FAILED",
      status: 500,
    });
  }

  return {
    campaign,
  };
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripeClient();
  const campaignIdFromMetadata =
    typeof session.metadata?.adCampaignId === "string"
      ? session.metadata.adCampaignId
      : null;

  const campaign =
    (session.id ? await findCampaignByCheckoutSessionId(session.id) : null) ||
    (campaignIdFromMetadata
      ? {
          id: campaignIdFromMetadata,
          status: "checkout_pending" as const,
        }
      : null);

  if (!campaign) {
    return;
  }

  const subscriptionId = getResourceId(session.subscription);
  const customerId = getResourceId(session.customer);

  let subscription: Stripe.Subscription | null = null;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  }

  const now = new Date();
  const stripeStatus = subscription?.status ?? "active";
  const cancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);
  const period = subscription ? getSubscriptionPeriod(subscription) : null;
  const nextStatus = resolveCampaignStatusFromSubscription({
    currentStatus: campaign.status,
    stripeStatus,
    cancelAtPeriodEnd,
  });

  await db
    .update(adCampaign)
    .set({
      status: nextStatus,
      stripeCustomerId: customerId,
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: stripeStatus,
      cancelAtPeriodEnd,
      currentPeriodStart: period?.currentPeriodStart ?? null,
      currentPeriodEnd: period?.currentPeriodEnd ?? null,
      checkoutExpiresAt: null,
      canceledAt: nextStatus === "ended" ? now : null,
      updatedAt: now,
    })
    .where(eq(adCampaign.id, campaign.id));
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const now = new Date();
  await db
    .update(adCampaign)
    .set({
      status: "canceled",
      canceledAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(adCampaign.stripeCheckoutSessionId, session.id),
        eq(adCampaign.status, "checkout_pending"),
      ),
    );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  const campaign = await findCampaignBySubscriptionId(subscriptionId);

  if (!campaign) {
    const metadataCampaignId =
      typeof subscription.metadata?.adCampaignId === "string"
        ? subscription.metadata.adCampaignId
        : null;

    if (!metadataCampaignId) {
      return;
    }

    await db
      .update(adCampaign)
      .set({
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      })
      .where(eq(adCampaign.id, metadataCampaignId));

    await updateCampaignFromSubscription({
      campaignId: metadataCampaignId,
      currentCampaignStatus: "active",
      subscription,
    });
    return;
  }

  await updateCampaignFromSubscription({
    campaignId: campaign.id,
    currentCampaignStatus: campaign.status,
    subscription,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const campaign = await findCampaignBySubscriptionId(subscription.id);
  if (!campaign) {
    return;
  }

  const now = new Date();
  const period = getSubscriptionPeriod(subscription);
  await db
    .update(adCampaign)
    .set({
      status: campaign.status === "suspended_policy" ? "suspended_policy" : "ended",
      stripeSubscriptionStatus: subscription.status,
      cancelAtPeriodEnd: true,
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      canceledAt: now,
      updatedAt: now,
    })
    .where(eq(adCampaign.id, campaign.id));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = getResourceId(subscriptionDetails?.subscription);

  if (!subscriptionId) {
    return;
  }

  await db
    .update(adCampaign)
    .set({
      stripeSubscriptionStatus: "invoice_payment_failed",
      updatedAt: new Date(),
    })
    .where(eq(adCampaign.stripeSubscriptionId, subscriptionId));
}

export function parsePlatformStripeWebhookEvent(
  rawBody: string,
  signature: string | null,
) {
  if (!signature) {
    throw new AdsServiceError("Missing Stripe signature.", {
      code: "WEBHOOK_SIGNATURE_MISSING",
      status: 400,
    });
  }

  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      requireStripePlatformWebhookSecret(),
    );
  } catch {
    throw new AdsServiceError("Invalid Stripe webhook signature.", {
      code: "WEBHOOK_SIGNATURE_INVALID",
      status: 400,
    });
  }
}

export async function processPlatformStripeWebhookEvent(event: Stripe.Event) {
  const shouldProcess = await markWebhookEventProcessed(event);
  if (!shouldProcess) {
    return;
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      return;
    case "checkout.session.expired":
      await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
      return;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      return;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      return;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      return;
    default:
      return;
  }
}

export async function getAdCampaignByUserIdOrThrow(userId: string): Promise<AdCampaignDTO> {
  const campaign = await getCampaignByUserId(userId);

  if (!campaign) {
    throw new AdsServiceError("Campaign not found.", {
      code: "CAMPAIGN_NOT_FOUND",
      status: 404,
    });
  }

  return campaign;
}

export async function getCampaignById(id: string) {
  const [row] = await db
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
    .where(eq(adCampaign.id, id))
    .limit(1);

  return row ? mapAdCampaignDTO(row) : null;
}
