import { stripe } from "@better-auth/stripe";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { toNextJsHandler } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { decodeJwt } from "jose";
import { db } from "./db";
import * as schema from "./db/schema";
import { getStripeClient } from "./stripe";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_FALLBACK = "user";
const DEFAULT_DEV_AUTH_URL = "http://localhost:3039";
const X_CLIENT_ID = process.env.X_CLIENT_ID ?? process.env.TWITER_CLIENT_ID;
const X_CLIENT_SECRET =
  process.env.X_CLIENT_SECRET ?? process.env.TWITER_CLIENT_SECRET;

function resolveAuthBaseURL(): string | undefined {
  const configuredUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.PUBLIC_BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.APP_URL ??
    process.env.SITE_URL;

  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.trim();
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_AUTH_URL;
  }

  return undefined;
}

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

type TwitterProfile = {
  data?: {
    id?: string;
    username?: string;
    name?: string;
    email?: string;
    profile_image_url?: string;
  };
};

type TwitterIdTokenClaims = {
  sub?: unknown;
  name?: unknown;
  email?: unknown;
  email_verified?: unknown;
  preferred_username?: unknown;
  username?: unknown;
  picture?: unknown;
  profile_image_url?: unknown;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value !== "boolean") {
    return null;
  }

  return value;
}

function mapTwitterProfileToUser(profile: TwitterProfile) {
  const rawUsername = profile.data?.username?.toLowerCase();

  return {
    ...(rawUsername ? { username: rawUsername, xUsername: rawUsername } : {}),
    ...(profile.data?.name
      ? { displayUsername: profile.data.name }
      : rawUsername
        ? { displayUsername: rawUsername }
        : {}),
    ...(profile.data?.id ? { xAccountId: profile.data.id } : {}),
    xLinkedAt: new Date(),
  };
}

function parseTwitterIdToken(idToken: string) {
  try {
    const claims = decodeJwt(idToken) as TwitterIdTokenClaims;
    const id = asString(claims.sub);

    if (!id) {
      return null;
    }

    const username =
      asString(claims.preferred_username)?.toLowerCase() ??
      asString(claims.username)?.toLowerCase();
    const name = asString(claims.name) ?? username ?? id;
    const email = asString(claims.email);
    const emailVerified = asBoolean(claims.email_verified) ?? false;
    const image = asString(claims.picture) ?? asString(claims.profile_image_url);

    return {
      id,
      username,
      name,
      email,
      emailVerified,
      image,
    };
  } catch {
    return null;
  }
}

async function fetchTwitterProfile(accessToken: string): Promise<TwitterProfile | null> {
  const endpoints = [
    "https://api.x.com/2/users/me?user.fields=profile_image_url",
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    "https://api.x.com/2/users/me",
    "https://api.twitter.com/2/users/me",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as TwitterProfile;

      if (typeof data?.data?.id === "string") {
        return data;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchTwitterConfirmedEmail(accessToken: string): Promise<string | null> {
  const endpoints = [
    "https://api.x.com/2/users/me?user.fields=confirmed_email",
    "https://api.twitter.com/2/users/me?user.fields=confirmed_email",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        data?: {
          confirmed_email?: string;
        };
      };
      const confirmedEmail = data?.data?.confirmed_email;

      if (typeof confirmedEmail === "string" && confirmedEmail.length > 0) {
        return confirmedEmail;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function createAuth() {
  return betterAuth({
    baseURL: resolveAuthBaseURL(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    account: {
      accountLinking: {
        trustedProviders: ["twitter"],
        allowDifferentEmails: true,
      },
    },
    socialProviders: {
      twitter: {
        clientId: X_CLIENT_ID!,
        clientSecret: X_CLIENT_SECRET!,
        mapProfileToUser: (profile) => {
          return mapTwitterProfileToUser(profile as TwitterProfile);
        },
        getUserInfo: async (token) => {
          const idTokenData = token.idToken
            ? parseTwitterIdToken(token.idToken)
            : null;
          const profile = token.accessToken
            ? await fetchTwitterProfile(token.accessToken)
            : null;

          if (!profile?.data?.id && !idTokenData?.id) {
            return null;
          }

          const confirmedEmail = token.accessToken
            ? await fetchTwitterConfirmedEmail(token.accessToken)
            : null;
          const userId = profile?.data?.id ?? idTokenData?.id;
          const username =
            profile?.data?.username?.toLowerCase() ?? idTokenData?.username;
          const name = profile?.data?.name ?? idTokenData?.name ?? username ?? userId;
          const email =
            confirmedEmail ??
            profile?.data?.email ??
            idTokenData?.email ??
            username ??
            `${userId}@x.local`;
          const emailVerified =
            Boolean(confirmedEmail) || Boolean(idTokenData?.emailVerified);
          const image =
            profile?.data?.profile_image_url ??
            idTokenData?.image ??
            undefined;
          const userMap = profile
            ? mapTwitterProfileToUser(profile)
            : {
                ...(username ? { username, xUsername: username } : {}),
                ...(idTokenData?.name
                  ? { displayUsername: idTokenData.name }
                  : username
                    ? { displayUsername: username }
                    : {}),
                ...(userId ? { xAccountId: userId } : {}),
                xLinkedAt: new Date(),
              };

          return {
            user: {
              id: userId!,
              name,
              email,
              image,
              emailVerified,
              ...userMap,
            },
            data: profile ?? idTokenData ?? {},
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
