import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { db } from "./db";
import * as schema from "./db/schema";
import { getStripeClient, getBetterAuthPlans, getTier } from "./stripe";
import type { TierName } from "./stripe";

// Lazily initialised so the module can be imported during Next.js static
// page-data collection when env vars are not yet available.

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
          getCheckoutSessionParams: async ({ plan }) => {
            const tier = getTier(plan.name as TierName);
            return {
              params: {
                ...(tier.couponId
                  ? { discounts: [{ coupon: tier.couponId }] }
                  : {}),
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

let _auth: Auth | null = null;

export function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}

export const auth = new Proxy({} as Auth, {
  get(_, prop) {
    return (getAuth() as Record<string | symbol, unknown>)[prop];
  },
});

export type Session = typeof auth.$Infer.Session;

let _handler: ReturnType<typeof toNextJsHandler> | null = null;

function getHandler() {
  if (!_handler) {
    _handler = toNextJsHandler(getAuth());
  }
  return _handler;
}

export const handler = {
  GET: (...args: Parameters<ReturnType<typeof toNextJsHandler>["GET"]>) =>
    getHandler().GET(...args),
  POST: (...args: Parameters<ReturnType<typeof toNextJsHandler>["POST"]>) =>
    getHandler().POST(...args),
};
