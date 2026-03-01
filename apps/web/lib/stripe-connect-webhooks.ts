import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripeConnectWebhookEvent, user } from "@/lib/db/schema";
import { getStripeClient } from "@/lib/stripe";
import {
  handleTemplatePurchaseCheckoutCompleted,
  handleTemplatePurchaseCheckoutExpired,
} from "@/lib/purchases/service";

type ConnectWebhookErrorOptions = {
  code?: string;
  status?: number;
};

class ConnectWebhookError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options?: ConnectWebhookErrorOptions) {
    super(message);
    this.name = "ConnectWebhookError";
    this.code = options?.code ?? "CONNECT_WEBHOOK_ERROR";
    this.status = options?.status ?? 400;
  }
}

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

function requireStripeConnectWebhookSecret() {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new ConnectWebhookError("Missing Stripe connect webhook secret.", {
      code: "WEBHOOK_SECRET_MISSING",
      status: 500,
    });
  }

  return secret;
}

function resolveConnectedAccountId(event: Stripe.Event): string | null {
  if (typeof event.account === "string" && event.account.trim().length > 0) {
    return event.account;
  }

  if (event.type === "account.updated") {
    const account = event.data.object as { id?: unknown };
    return typeof account.id === "string" ? account.id : null;
  }

  return null;
}

async function markConnectWebhookEventProcessed(
  event: Stripe.Event,
  accountId: string,
): Promise<boolean> {
  try {
    await db.insert(stripeConnectWebhookEvent).values({
      eventId: event.id,
      accountId,
      eventType: event.type,
      processedAt: new Date(),
    });
    return true;
  } catch (error) {
    if (isUniqueViolation(error, "stripe_connect_webhook_event_pkey")) {
      return false;
    }

    throw error;
  }
}

async function handleConnectedAccountUpdated(account: Stripe.Account) {
  const detailsSubmitted = Boolean(account.details_submitted);
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const verified = detailsSubmitted && chargesEnabled && payoutsEnabled;

  await db
    .update(user)
    .set({
      stripeVerified: verified,
      updatedAt: new Date(),
    })
    .where(eq(user.stripeAccountId, account.id));
}

export function parseConnectStripeWebhookEvent(
  rawBody: string,
  signature: string | null,
): Stripe.Event {
  if (!signature) {
    throw new ConnectWebhookError("Missing Stripe signature.", {
      code: "WEBHOOK_SIGNATURE_MISSING",
      status: 400,
    });
  }

  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      requireStripeConnectWebhookSecret(),
    );
  } catch {
    throw new ConnectWebhookError("Invalid Stripe webhook signature.", {
      code: "WEBHOOK_SIGNATURE_INVALID",
      status: 400,
    });
  }
}

export async function processConnectStripeWebhookEvent(event: Stripe.Event) {
  const accountId = resolveConnectedAccountId(event);
  if (!accountId) {
    throw new ConnectWebhookError("Missing connected account context.", {
      code: "CONNECTED_ACCOUNT_MISSING",
      status: 400,
    });
  }

  const shouldProcess = await markConnectWebhookEventProcessed(event, accountId);
  if (!shouldProcess) {
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") {
        return;
      }

      await handleTemplatePurchaseCheckoutCompleted(session, event.id);
      return;
    }
    case "checkout.session.async_payment_succeeded":
      await handleTemplatePurchaseCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session,
        event.id,
      );
      return;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await handleTemplatePurchaseCheckoutExpired(
        event.data.object as Stripe.Checkout.Session,
        event.id,
      );
      return;
    case "account.updated":
      await handleConnectedAccountUpdated(event.data.object as Stripe.Account);
      return;
    default:
      return;
  }
}
