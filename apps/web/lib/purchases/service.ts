import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import {
  commissionOverride,
  purchase,
  purchaseEvent,
  user,
} from "@/lib/db/schema";
import { templatePath } from "@/lib/routes";
import { getStripeClient } from "@/lib/stripe";
import {
  DEFAULT_PLATFORM_COMMISSION_RATE,
  type TemplateSaleType,
} from "@/lib/templates/commission";
import { deriveTemplateExcerptFromMarkdown } from "@/lib/templates/form-helpers";
import { requireTemplateRecordBySlug } from "@/lib/templates/repository";
import { PurchaseServiceError } from "./errors";
import type { CreatePurchaseCheckoutInput } from "./schemas";
import type { CreatePurchaseCheckoutResponse } from "./types";
import { cookies } from "next/headers";

type PurchaseStatus = "pending" | "completed" | "failed";
type PurchaseEventType =
  | "checkout_started"
  | "checkout_completed"
  | "checkout_expired"
  | "free_claimed"
  | "free_claimed_auto"
  | "download_completed";
type PurchaseEventSource = "api" | "webhook" | "download";

type PurchaseRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  templateId: string;
  status: PurchaseStatus;
  completedAt: Date | null;
  stripeCheckoutSessionId: string | null;
};

type StripeUserRow = {
  email: string;
};

type SellerStripeRow = {
  id: string;
  username: string;
  stripeAccountId: string | null;
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

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    throw new PurchaseServiceError("Invalid base URL.", {
      code: "INVALID_BASE_URL",
      status: 400,
    });
  }
  return trimmed;
}

function normalizeRef(value: string | undefined): string | null {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function toStripeCurrencyCode(currency: string): string {
  const normalized = currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new PurchaseServiceError("Unsupported currency.", {
      code: "CURRENCY_INVALID",
      status: 400,
    });
  }
  return normalized;
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

function resolveSaleType(input: { sellerUsername: string; ref?: string }): {
  saleType: TemplateSaleType;
  referralCode: string | null;
} {
  const normalizedRef = normalizeRef(input.ref);
  const sellerUsername = input.sellerUsername.trim().toLowerCase();

  if (normalizedRef && normalizedRef === sellerUsername) {
    return {
      saleType: "direct",
      referralCode: normalizedRef,
    };
  }

  return {
    saleType: "browsing",
    referralCode: null,
  };
}

function calculateSplitFromRate(priceCents: number, commissionRate: number) {
  const platformFeeCents = Math.round((priceCents * commissionRate) / 100);
  const sellerPayoutCents = Math.max(0, priceCents - platformFeeCents);

  return {
    platformFeeCents,
    sellerPayoutCents,
  };
}

async function findPurchaseByBuyerTemplate(
  buyerId: string,
  templateId: string,
): Promise<PurchaseRow | null> {
  const [record] = await db
    .select({
      id: purchase.id,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      templateId: purchase.templateId,
      status: purchase.status,
      completedAt: purchase.completedAt,
      stripeCheckoutSessionId: purchase.stripeCheckoutSessionId,
    })
    .from(purchase)
    .where(
      and(eq(purchase.buyerId, buyerId), eq(purchase.templateId, templateId)),
    )
    .limit(1);

  return record ?? null;
}

async function findPurchaseById(id: string): Promise<PurchaseRow | null> {
  const [record] = await db
    .select({
      id: purchase.id,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      templateId: purchase.templateId,
      status: purchase.status,
      completedAt: purchase.completedAt,
      stripeCheckoutSessionId: purchase.stripeCheckoutSessionId,
    })
    .from(purchase)
    .where(eq(purchase.id, id))
    .limit(1);

  return record ?? null;
}

async function findPurchaseByCheckoutSessionId(
  checkoutSessionId: string,
): Promise<PurchaseRow | null> {
  const [record] = await db
    .select({
      id: purchase.id,
      buyerId: purchase.buyerId,
      sellerId: purchase.sellerId,
      templateId: purchase.templateId,
      status: purchase.status,
      completedAt: purchase.completedAt,
      stripeCheckoutSessionId: purchase.stripeCheckoutSessionId,
    })
    .from(purchase)
    .where(eq(purchase.stripeCheckoutSessionId, checkoutSessionId))
    .limit(1);

  return record ?? null;
}

async function getStripeUserRow(userId: string): Promise<StripeUserRow> {
  const [row] = await db
    .select({
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new PurchaseServiceError("User not found.", {
      code: "USER_NOT_FOUND",
      status: 404,
    });
  }

  return row;
}

async function getSellerStripeRow(userId: string): Promise<SellerStripeRow> {
  const [row] = await db
    .select({
      id: user.id,
      username: user.username,
      stripeAccountId: user.stripeAccountId,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) {
    throw new PurchaseServiceError("Seller not found.", {
      code: "SELLER_NOT_FOUND",
      status: 404,
    });
  }

  return row;
}

async function resolveCommissionRate(
  sellerId: string,
  saleType: TemplateSaleType,
): Promise<number> {
  const [override] = await db
    .select({
      directRate: commissionOverride.directRate,
      browsingRate: commissionOverride.browsingRate,
    })
    .from(commissionOverride)
    .where(eq(commissionOverride.userId, sellerId))
    .limit(1);

  if (!override) {
    return DEFAULT_PLATFORM_COMMISSION_RATE[saleType];
  }

  return saleType === "direct" ? override.directRate : override.browsingRate;
}

async function createPurchaseEventEntry(options: {
  purchaseId: string | null;
  buyerId: string;
  templateId: string;
  eventType: PurchaseEventType;
  source: PurchaseEventSource;
  stripeEventId?: string | null;
  stripeCheckoutSessionId?: string | null;
}) {
  try {
    await db.insert(purchaseEvent).values({
      id: randomUUID(),
      purchaseId: options.purchaseId,
      buyerId: options.buyerId,
      templateId: options.templateId,
      eventType: options.eventType,
      source: options.source,
      stripeEventId: options.stripeEventId ?? null,
      stripeCheckoutSessionId: options.stripeCheckoutSessionId ?? null,
      createdAt: new Date(),
    });
  } catch (error) {
    if (isUniqueViolation(error, "purchase_event_stripe_event_id_unique")) {
      return;
    }
    throw error;
  }
}

async function completeFreePurchase(options: {
  buyerId: string;
  sellerId: string;
  templateId: string;
  saleType: TemplateSaleType;
  referralCode: string | null;
  existingPurchase?: PurchaseRow | null;
  eventType: "free_claimed" | "free_claimed_auto";
  source: "api" | "download";
}): Promise<{ purchaseId: string; createdOrTransitioned: boolean }> {
  const now = new Date();
  const existing =
    options.existingPurchase ??
    (await findPurchaseByBuyerTemplate(options.buyerId, options.templateId));

  if (existing?.status === "completed") {
    return {
      purchaseId: existing.id,
      createdOrTransitioned: false,
    };
  }

  if (existing) {
    await db
      .update(purchase)
      .set({
        sellerId: options.sellerId,
        priceCents: 0,
        commissionRate: 0,
        platformFeeAmountCents: 0,
        sellerPayoutAmountCents: 0,
        saleType: options.saleType,
        referralCode: options.referralCode,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        stripeTransferId: null,
        status: "completed",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(purchase.id, existing.id));

    await createPurchaseEventEntry({
      purchaseId: existing.id,
      buyerId: options.buyerId,
      templateId: options.templateId,
      eventType: options.eventType,
      source: options.source,
    });

    return {
      purchaseId: existing.id,
      createdOrTransitioned: true,
    };
  }

  try {
    const id = randomUUID();
    await db.insert(purchase).values({
      id,
      buyerId: options.buyerId,
      sellerId: options.sellerId,
      templateId: options.templateId,
      priceCents: 0,
      commissionRate: 0,
      platformFeeAmountCents: 0,
      sellerPayoutAmountCents: 0,
      saleType: options.saleType,
      referralCode: options.referralCode,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeTransferId: null,
      status: "completed",
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await createPurchaseEventEntry({
      purchaseId: id,
      buyerId: options.buyerId,
      templateId: options.templateId,
      eventType: options.eventType,
      source: options.source,
    });

    return {
      purchaseId: id,
      createdOrTransitioned: true,
    };
  } catch (error) {
    if (!isUniqueViolation(error, "purchase_buyer_template_unique")) {
      throw error;
    }

    const afterConflict = await findPurchaseByBuyerTemplate(
      options.buyerId,
      options.templateId,
    );
    if (!afterConflict) {
      throw error;
    }

    if (afterConflict.status === "completed") {
      return {
        purchaseId: afterConflict.id,
        createdOrTransitioned: false,
      };
    }

    await db
      .update(purchase)
      .set({
        sellerId: options.sellerId,
        priceCents: 0,
        commissionRate: 0,
        platformFeeAmountCents: 0,
        sellerPayoutAmountCents: 0,
        saleType: options.saleType,
        referralCode: options.referralCode,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        stripeTransferId: null,
        status: "completed",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(purchase.id, afterConflict.id));

    await createPurchaseEventEntry({
      purchaseId: afterConflict.id,
      buyerId: options.buyerId,
      templateId: options.templateId,
      eventType: options.eventType,
      source: options.source,
    });

    return {
      purchaseId: afterConflict.id,
      createdOrTransitioned: true,
    };
  }
}

async function upsertPendingPurchase(options: {
  buyerId: string;
  sellerId: string;
  templateId: string;
  priceCents: number;
  commissionRate: number;
  platformFeeAmountCents: number;
  sellerPayoutAmountCents: number;
  saleType: TemplateSaleType;
  referralCode: string | null;
  existingPurchase?: PurchaseRow | null;
}): Promise<{ purchaseId: string; alreadyCompleted: boolean }> {
  const now = new Date();
  const existing =
    options.existingPurchase ??
    (await findPurchaseByBuyerTemplate(options.buyerId, options.templateId));

  if (existing?.status === "completed") {
    return {
      purchaseId: existing.id,
      alreadyCompleted: true,
    };
  }

  if (existing) {
    await db
      .update(purchase)
      .set({
        sellerId: options.sellerId,
        priceCents: options.priceCents,
        commissionRate: options.commissionRate,
        platformFeeAmountCents: options.platformFeeAmountCents,
        sellerPayoutAmountCents: options.sellerPayoutAmountCents,
        saleType: options.saleType,
        referralCode: options.referralCode,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        stripeTransferId: null,
        status: "pending",
        completedAt: null,
        updatedAt: now,
      })
      .where(eq(purchase.id, existing.id));

    return {
      purchaseId: existing.id,
      alreadyCompleted: false,
    };
  }

  try {
    const id = randomUUID();
    await db.insert(purchase).values({
      id,
      buyerId: options.buyerId,
      sellerId: options.sellerId,
      templateId: options.templateId,
      priceCents: options.priceCents,
      commissionRate: options.commissionRate,
      platformFeeAmountCents: options.platformFeeAmountCents,
      sellerPayoutAmountCents: options.sellerPayoutAmountCents,
      saleType: options.saleType,
      referralCode: options.referralCode,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeTransferId: null,
      status: "pending",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      purchaseId: id,
      alreadyCompleted: false,
    };
  } catch (error) {
    if (!isUniqueViolation(error, "purchase_buyer_template_unique")) {
      throw error;
    }

    const afterConflict = await findPurchaseByBuyerTemplate(
      options.buyerId,
      options.templateId,
    );
    if (!afterConflict) {
      throw error;
    }

    if (afterConflict.status === "completed") {
      return {
        purchaseId: afterConflict.id,
        alreadyCompleted: true,
      };
    }

    await db
      .update(purchase)
      .set({
        sellerId: options.sellerId,
        priceCents: options.priceCents,
        commissionRate: options.commissionRate,
        platformFeeAmountCents: options.platformFeeAmountCents,
        sellerPayoutAmountCents: options.sellerPayoutAmountCents,
        saleType: options.saleType,
        referralCode: options.referralCode,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        stripeTransferId: null,
        status: "pending",
        completedAt: null,
        updatedAt: now,
      })
      .where(eq(purchase.id, afterConflict.id));

    return {
      purchaseId: afterConflict.id,
      alreadyCompleted: false,
    };
  }
}

async function resolvePurchaseFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<PurchaseRow | null> {
  const purchaseIdFromMetadata =
    typeof session.metadata?.purchaseId === "string"
      ? session.metadata.purchaseId
      : null;

  const bySession = session.id
    ? await findPurchaseByCheckoutSessionId(session.id)
    : null;
  if (bySession) {
    return bySession;
  }

  if (!purchaseIdFromMetadata) {
    return null;
  }

  return findPurchaseById(purchaseIdFromMetadata);
}

function isTemplatePurchaseSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.kind === "template_purchase";
}

export async function createTemplatePurchaseCheckout(options: {
  buyerId: string;
  input: CreatePurchaseCheckoutInput;
  baseUrl: string;
}): Promise<CreatePurchaseCheckoutResponse> {
  const templateRow = await requireTemplateRecordBySlug(
    options.input.templateSlug,
  );
  const cookieStore = await cookies();

  if (
    templateRow.status !== "published" ||
    templateRow.deletedAt !== null ||
    templateRow.isFlagged
  ) {
    throw new PurchaseServiceError("Template is not available for purchase.", {
      code: "TEMPLATE_UNAVAILABLE",
      status: 404,
    });
  }

  if (options.buyerId === templateRow.sellerId) {
    throw new PurchaseServiceError("You cannot purchase your own template.", {
      code: "SELF_PURCHASE_FORBIDDEN",
      status: 400,
    });
  }

  const sellerRow = await getSellerStripeRow(templateRow.sellerId);
  const sale = resolveSaleType({
    sellerUsername: sellerRow.username,
    ref: options.input.ref,
  });
  const existingPurchase = await findPurchaseByBuyerTemplate(
    options.buyerId,
    templateRow.id,
  );

  if (existingPurchase?.status === "completed") {
    return {
      flow: "owned",
      purchaseId: existingPurchase.id,
    };
  }

  if (templateRow.priceCents === 0) {
    const completed = await completeFreePurchase({
      buyerId: options.buyerId,
      sellerId: templateRow.sellerId,
      templateId: templateRow.id,
      saleType: sale.saleType,
      referralCode: sale.referralCode,
      existingPurchase,
      eventType: "free_claimed",
      source: "api",
    });

    return {
      flow: "free",
      purchaseId: completed.purchaseId,
    };
  }

  if (!sellerRow.stripeAccountId) {
    throw new PurchaseServiceError("Seller Stripe account is unavailable.", {
      code: "SELLER_STRIPE_ACCOUNT_MISSING",
      status: 409,
    });
  }

  const commissionRate = await resolveCommissionRate(
    templateRow.sellerId,
    sale.saleType,
  );
  const split = calculateSplitFromRate(templateRow.priceCents, commissionRate);
  const pending = await upsertPendingPurchase({
    buyerId: options.buyerId,
    sellerId: templateRow.sellerId,
    templateId: templateRow.id,
    priceCents: templateRow.priceCents,
    commissionRate,
    platformFeeAmountCents: split.platformFeeCents,
    sellerPayoutAmountCents: split.sellerPayoutCents,
    saleType: sale.saleType,
    referralCode: sale.referralCode,
    existingPurchase,
  });

  if (pending.alreadyCompleted) {
    return {
      flow: "owned",
      purchaseId: pending.purchaseId,
    };
  }

  const stripe = getStripeClient();
  const stripeUser = await getStripeUserRow(options.buyerId);
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: stripeUser.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: toStripeCurrencyCode(templateRow.currency),
              unit_amount: templateRow.priceCents,
              product_data: {
                name: templateRow.title,
                description: deriveTemplateExcerptFromMarkdown(
                  templateRow.description,
                  180,
                ),
              },
            },
          },
        ],
        success_url: `${baseUrl}${templatePath(templateRow.slug)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}${templatePath(templateRow.slug)}?checkout=cancel`,
        metadata: {
          kind: "template_purchase",
          purchaseId: pending.purchaseId,
          buyerId: options.buyerId,
          templateId: templateRow.id,
        },
        payment_intent_data: {
          application_fee_amount: split.platformFeeCents,
          metadata: {
            kind: "template_purchase",
            purchaseId: pending.purchaseId,
            buyerId: options.buyerId,
            templateId: templateRow.id,
            datafast_visitor_id:
              cookieStore.get("datafast_visitor_id")?.value || null,
            datafast_session_id:
              cookieStore.get("datafast_session_id")?.value || null,
          },
        },
        client_reference_id: pending.purchaseId,
      },
      {
        stripeAccount: sellerRow.stripeAccountId,
      },
    );
  } catch (error) {
    await db
      .update(purchase)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(purchase.id, pending.purchaseId));
    throw error;
  }

  if (!session.url) {
    throw new PurchaseServiceError("Stripe checkout URL is unavailable.", {
      code: "CHECKOUT_URL_MISSING",
      status: 500,
    });
  }

  await db
    .update(purchase)
    .set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(purchase.id, pending.purchaseId));

  await createPurchaseEventEntry({
    purchaseId: pending.purchaseId,
    buyerId: options.buyerId,
    templateId: templateRow.id,
    eventType: "checkout_started",
    source: "api",
    stripeCheckoutSessionId: session.id,
  });

  return {
    flow: "paid",
    purchaseId: pending.purchaseId,
    checkoutUrl: session.url,
  };
}

export async function handleTemplatePurchaseCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string,
) {
  if (!isTemplatePurchaseSession(session)) {
    return;
  }

  const purchaseRow = await resolvePurchaseFromCheckoutSession(session);
  if (!purchaseRow) {
    return;
  }

  const now = new Date();
  const paymentIntentId = getResourceId(session.payment_intent);

  await db
    .update(purchase)
    .set({
      status: "completed",
      completedAt: purchaseRow.completedAt ?? now,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      updatedAt: now,
    })
    .where(eq(purchase.id, purchaseRow.id));

  await createPurchaseEventEntry({
    purchaseId: purchaseRow.id,
    buyerId: purchaseRow.buyerId,
    templateId: purchaseRow.templateId,
    eventType: "checkout_completed",
    source: "webhook",
    stripeEventId,
    stripeCheckoutSessionId: session.id,
  });
}

export async function handleTemplatePurchaseCheckoutExpired(
  session: Stripe.Checkout.Session,
  stripeEventId: string,
) {
  if (!isTemplatePurchaseSession(session)) {
    return;
  }

  const purchaseRow = await resolvePurchaseFromCheckoutSession(session);
  if (!purchaseRow || purchaseRow.status === "completed") {
    return;
  }

  await db
    .update(purchase)
    .set({
      status: "failed",
      updatedAt: new Date(),
    })
    .where(eq(purchase.id, purchaseRow.id));

  await createPurchaseEventEntry({
    purchaseId: purchaseRow.id,
    buyerId: purchaseRow.buyerId,
    templateId: purchaseRow.templateId,
    eventType: "checkout_expired",
    source: "webhook",
    stripeEventId,
    stripeCheckoutSessionId: session.id,
  });
}

export async function ensureFreeTemplateOwnership(options: {
  buyerId: string;
  sellerId: string;
  templateId: string;
}): Promise<{ purchaseId: string }> {
  const completed = await completeFreePurchase({
    buyerId: options.buyerId,
    sellerId: options.sellerId,
    templateId: options.templateId,
    saleType: "browsing",
    referralCode: null,
    eventType: "free_claimed_auto",
    source: "download",
  });

  return {
    purchaseId: completed.purchaseId,
  };
}

export async function recordTemplateDownloadCompleted(options: {
  purchaseId: string | null;
  buyerId: string;
  templateId: string;
}) {
  await createPurchaseEventEntry({
    purchaseId: options.purchaseId,
    buyerId: options.buyerId,
    templateId: options.templateId,
    eventType: "download_completed",
    source: "download",
  });
}
