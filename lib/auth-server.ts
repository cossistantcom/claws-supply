import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./db/schema";
import { getTierConfig, getBetterAuthPlans } from "./pricing/config";
import { isPlanSelectable, getPricingSnapshot } from "./pricing/service";
import { getStripeClient } from "./stripe";
import type { TierName } from "./pricing/types";

function isTierName(value: string): value is TierName {
  return value === "founding" || value === "next" || value === "final";
}

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        creatorRole: "owner",
        teams: {
          enabled: true,
        },
      }),
      stripe({
        stripeClient: getStripeClient(),
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          plans: getBetterAuthPlans(),
          authorizeReference: async ({ user, referenceId }) => {
            const membership = await db
              .select({ id: schema.member.id })
              .from(schema.member)
              .where(
                and(
                  eq(schema.member.organizationId, referenceId),
                  eq(schema.member.userId, user.id),
                ),
              )
              .limit(1);

            return membership.length > 0;
          },
          getCheckoutSessionParams: async ({ plan }) => {
            if (!isTierName(plan.name)) {
              throw new APIError("BAD_REQUEST", {
                message: "Selected plan is invalid.",
              });
            }

            const pricing = await getPricingSnapshot({ forceFresh: true });
            if (pricing.integrityStatus === "degraded" && plan.name !== "final") {
              throw new APIError("BAD_REQUEST", {
                message:
                  "Discounted tiers are temporarily unavailable. Please choose the final tier.",
              });
            }

            if (!isPlanSelectable(pricing, plan.name)) {
              throw new APIError("BAD_REQUEST", {
                message:
                  "Selected plan is no longer available. Refresh and choose an available tier.",
              });
            }

            const couponId = getTierConfig(plan.name).couponId;

            return {
              params: {
                ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
              },
            };
          },
        },
        organization: {
          enabled: true,
        },
      }),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

let cachedAuth: Auth | null = null;

export function getAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = createAuth();
  }
  return cachedAuth;
}

export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    return (getAuth() as Record<string | symbol, unknown>)[prop];
  },
});

export type Session = typeof auth.$Infer.Session;

let cachedHandler: ReturnType<typeof toNextJsHandler> | null = null;

function getHandler() {
  if (!cachedHandler) {
    cachedHandler = toNextJsHandler(getAuth());
  }
  return cachedHandler;
}

export const handler = {
  GET: (...args: Parameters<ReturnType<typeof toNextJsHandler>["GET"]>) =>
    getHandler().GET(...args),
  POST: (...args: Parameters<ReturnType<typeof toNextJsHandler>["POST"]>) =>
    getHandler().POST(...args),
};
