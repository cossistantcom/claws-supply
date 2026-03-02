import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
import { getStripeClient } from "@/lib/stripe";
import type { ProfileDTO, ProfileUpdateInput, StripeStatusDTO } from "./types";

const PROFILE_NAME_MAX_LENGTH = 80;
const PROFILE_BIO_MAX_LENGTH = 280;

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  image: string | null;
  xUsername: string | null;
  xLinkedAt: Date | null;
  stripeAccountId: string | null;
  stripeVerified: boolean;
};

type TwitterAccountRow = {
  accountId: string;
  createdAt: Date;
};

type StripeStatusOptions = {
  strict?: boolean;
};

function getDisconnectedStripeStatus(): StripeStatusDTO {
  return {
    connected: false,
    verified: false,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    accountId: null,
  };
}

function mapProfile(
  row: ProfileRow,
  stripeStatus: StripeStatusDTO,
  twitterAccount: TwitterAccountRow | null,
): ProfileDTO {
  const linkedAt = twitterAccount?.createdAt ?? row.xLinkedAt;

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    bio: row.bio,
    image: row.image,
    x: {
      linked: Boolean(twitterAccount),
      username: row.xUsername,
      accountId: twitterAccount?.accountId ?? null,
      linkedAt: linkedAt ? linkedAt.toISOString() : null,
    },
    stripe: stripeStatus,
  };
}

function isVerifiedStripeSeller(
  detailsSubmitted: boolean,
  chargesEnabled: boolean,
  payoutsEnabled: boolean,
): boolean {
  return detailsSubmitted && chargesEnabled && payoutsEnabled;
}

async function getProfileRowById(userId: string): Promise<ProfileRow> {
  const [record] = await db
    .select({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      image: user.image,
      xUsername: user.xUsername,
      xLinkedAt: user.xLinkedAt,
      stripeAccountId: user.stripeAccountId,
      stripeVerified: user.stripeVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!record) {
    throw new Error("User not found.");
  }

  return record;
}

async function getTwitterAccountForUser(userId: string): Promise<TwitterAccountRow | null> {
  const [twitterAccount] = await db
    .select({
      accountId: account.accountId,
      createdAt: account.createdAt,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "twitter")))
    .orderBy(desc(account.createdAt))
    .limit(1);

  return twitterAccount ?? null;
}

async function getStripeStatusFromRow(
  row: ProfileRow,
  options?: StripeStatusOptions,
): Promise<StripeStatusDTO> {
  if (!row.stripeAccountId) {
    return getDisconnectedStripeStatus();
  }

  try {
    const stripeClient = getStripeClient();
    const account = await stripeClient.accounts.retrieve(row.stripeAccountId);

    if ("deleted" in account && account.deleted) {
      throw new Error("Stripe account not found.");
    }

    const detailsSubmitted = Boolean(account.details_submitted);
    const chargesEnabled = Boolean(account.charges_enabled);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const verified = isVerifiedStripeSeller(
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
    );

    if (verified !== row.stripeVerified) {
      await db
        .update(user)
        .set({
          stripeVerified: verified,
          updatedAt: new Date(),
        })
        .where(eq(user.id, row.id));
    }

    return {
      connected: true,
      verified,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      accountId: row.stripeAccountId,
    };
  } catch (error) {
    if (options?.strict) {
      throw error;
    }

    return {
      connected: true,
      verified: row.stripeVerified,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      accountId: row.stripeAccountId,
    };
  }
}

export function validateProfileUpdateInput(input: unknown): ProfileUpdateInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid profile update payload.");
  }

  const rawInput = input as Record<string, unknown>;
  const allowedFields = new Set(["name", "bio"]);

  for (const key of Object.keys(rawInput)) {
    if (!allowedFields.has(key)) {
      throw new Error(`Field "${key}" cannot be updated.`);
    }
  }

  if (typeof rawInput.name !== "string") {
    throw new Error("`name` must be a string.");
  }

  const name = rawInput.name.trim();

  if (!name) {
    throw new Error("Name cannot be empty.");
  }

  if (name.length > PROFILE_NAME_MAX_LENGTH) {
    throw new Error(
      `Name must be ${PROFILE_NAME_MAX_LENGTH} characters or less.`,
    );
  }

  let bio: string | null = null;

  if (typeof rawInput.bio === "string") {
    const nextBio = rawInput.bio.trim();

    if (nextBio.length > PROFILE_BIO_MAX_LENGTH) {
      throw new Error(`Bio must be ${PROFILE_BIO_MAX_LENGTH} characters or less.`);
    }

    bio = nextBio.length > 0 ? nextBio : null;
  } else if (rawInput.bio === null || typeof rawInput.bio === "undefined") {
    bio = null;
  } else {
    throw new Error("`bio` must be a string or null.");
  }

  return {
    name,
    bio,
  };
}

export async function getProfileForUser(userId: string): Promise<ProfileDTO> {
  const [row, twitterAccount] = await Promise.all([
    getProfileRowById(userId),
    getTwitterAccountForUser(userId),
  ]);
  const stripeStatus = await getStripeStatusFromRow(row);

  return mapProfile(row, stripeStatus, twitterAccount);
}

export async function updateProfileForUser(
  userId: string,
  input: ProfileUpdateInput,
): Promise<ProfileDTO> {
  await db
    .update(user)
    .set({
      name: input.name,
      bio: input.bio,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return getProfileForUser(userId);
}

export async function getStripeStatusForUser(
  userId: string,
  options?: StripeStatusOptions,
): Promise<StripeStatusDTO> {
  const row = await getProfileRowById(userId);

  return getStripeStatusFromRow(row, options);
}

export async function createStripeConnectOnboardingLink(
  userId: string,
  baseUrl: string,
): Promise<{
  url: string;
  accountId: string;
}> {
  const row = await getProfileRowById(userId);
  const stripeClient = getStripeClient();

  let stripeAccountId = row.stripeAccountId;

  if (!stripeAccountId) {
    const stripeAccount = await stripeClient.accounts.create({
      type: "express",
      email: row.email,
      metadata: {
        userId: row.id,
      },
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });

    stripeAccountId = stripeAccount.id;

    await db
      .update(user)
      .set({
        stripeAccountId,
        stripeVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(user.id, row.id));
  }

  const accountLink = await stripeClient.accountLinks.create({
    account: stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${baseUrl}/profile?stripe=refresh`,
    return_url: `${baseUrl}/profile?stripe=return`,
  });

  return {
    url: accountLink.url,
    accountId: stripeAccountId,
  };
}
