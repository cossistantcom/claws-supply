import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { db } from "./db";
import * as schema from "./db/schema";

import { getStripeClient } from "./stripe";

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
