import { stripe } from "@better-auth/stripe";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { db } from "./db";
import * as schema from "./db/schema";
import { getStripeClient } from "./stripe";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_FALLBACK = "user";
const X_CLIENT_ID = process.env.X_CLIENT_ID ?? process.env.TWITER_CLIENT_ID;
const X_CLIENT_SECRET =
  process.env.X_CLIENT_SECRET ?? process.env.TWITER_CLIENT_SECRET;

function sanitizeUsername(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!cleaned) {
    return USERNAME_FALLBACK;
  }

  return cleaned;
}

function getEmailLocalPart(email: string): string {
  const [localPart] = email.split("@");
  return localPart ?? USERNAME_FALLBACK;
}

function clampUsernameLength(value: string): string {
  if (value.length < USERNAME_MIN_LENGTH) {
    return `${value}${USERNAME_FALLBACK}`.slice(0, USERNAME_MAX_LENGTH);
  }

  return value.slice(0, USERNAME_MAX_LENGTH);
}

async function usernameExists(username: string): Promise<boolean> {
  const existing = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.username, username))
    .limit(1);

  return existing.length > 0;
}

async function ensureUniqueUsername(candidate: string): Promise<string> {
  const base = clampUsernameLength(sanitizeUsername(candidate));

  if (!(await usernameExists(base))) {
    return base;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const suffixValue = `_${suffix}`;
    const trimmedBase = base
      .slice(0, USERNAME_MAX_LENGTH - suffixValue.length)
      .replace(/_+$/g, "");
    const nextCandidate = `${trimmedBase || USERNAME_FALLBACK}${suffixValue}`;

    if (!(await usernameExists(nextCandidate))) {
      return nextCandidate;
    }
  }

  return `${USERNAME_FALLBACK}_${Date.now().toString().slice(-6)}`;
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
    account: {
      accountLinking: {
        trustedProviders: ["twitter"],
      },
    },
    socialProviders: {
      twitter: {
        clientId: X_CLIENT_ID!,
        clientSecret: X_CLIENT_SECRET!,
        mapProfileToUser: (profile) => {
          const xProfile = profile as {
            data?: {
              id?: string;
              username?: string;
              name?: string;
            };
          };

          const rawUsername = xProfile.data?.username?.toLowerCase();

          return {
            ...(rawUsername ? { username: rawUsername, xUsername: rawUsername } : {}),
            ...(xProfile.data?.name
              ? { displayUsername: xProfile.data.name }
              : rawUsername
                ? { displayUsername: rawUsername }
                : {}),
            ...(xProfile.data?.id ? { xAccountId: xProfile.data.id } : {}),
            xLinkedAt: new Date(),
          };
        },
      },
    },
    user: {
      deleteUser: {
        enabled: true,
      },
      additionalFields: {
        bio: {
          type: "string",
          required: false,
        },
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
        },
        xAccountId: {
          type: "string",
          required: false,
        },
        xUsername: {
          type: "string",
          required: false,
        },
        xLinkedAt: {
          type: "date",
          required: false,
        },
        stripeAccountId: {
          type: "string",
          required: false,
        },
        stripeVerified: {
          type: "boolean",
          required: false,
          defaultValue: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (userRecord) => {
            const record = userRecord as Record<string, unknown>;
            const email =
              typeof record.email === "string" ? record.email : USERNAME_FALLBACK;

            const usernameCandidate =
              (typeof record.xUsername === "string" && record.xUsername) ||
              (typeof record.username === "string" && record.username) ||
              getEmailLocalPart(email);

            const uniqueUsername = await ensureUniqueUsername(usernameCandidate);

            const resolved = {
              ...record,
              username: uniqueUsername,
              displayUsername:
                typeof record.displayUsername === "string" &&
                record.displayUsername.trim().length > 0
                  ? record.displayUsername
                  : uniqueUsername,
              xLinkedAt:
                (typeof record.xAccountId === "string" ||
                  typeof record.xUsername === "string") &&
                !record.xLinkedAt
                  ? new Date()
                  : record.xLinkedAt,
            };

            return {
              data: resolved,
            };
          },
        },
      },
    },
    plugins: [
      username({
        minUsernameLength: USERNAME_MIN_LENGTH,
        maxUsernameLength: USERNAME_MAX_LENGTH,
        usernameValidator: (value) => /^[a-z0-9_]+$/.test(value),
        usernameNormalization: (value) => value.toLowerCase(),
      }),
      stripe({
        stripeClient: getStripeClient(),
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: false,
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
