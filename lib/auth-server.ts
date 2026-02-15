import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { db } from "./db";
import * as schema from "./db/schema";
import { stripeClient, getBetterAuthPlans, getTier } from "./stripe";
import type { TierName } from "./stripe";

export const auth = betterAuth({
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
      stripeClient,
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

export type Session = typeof auth.$Infer.Session;

export const handler = toNextJsHandler(auth);
