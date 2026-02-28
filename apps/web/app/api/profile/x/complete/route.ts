import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { auth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

type SocialProfile = {
  data?: {
    id?: unknown;
    username?: unknown;
    profile_image_url?: unknown;
  };
};

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function profileUrl(request: Request): URL {
  return new URL("/profile", request.url);
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  try {
    const linkedAccounts = await auth.api.listUserAccounts({
      headers: request.headers,
    });
    const twitterAccount = linkedAccounts.find(
      (account) => account.providerId === "twitter",
    );

    if (!twitterAccount) {
      return NextResponse.redirect(profileUrl(request));
    }

    let providerInfo: Awaited<ReturnType<typeof auth.api.accountInfo>> = null;

    try {
      providerInfo = await auth.api.accountInfo({
        headers: request.headers,
        query: {
          accountId: twitterAccount.id,
        },
      });
    } catch {
      providerInfo = null;
    }

    const now = new Date();
    const socialProfile =
      providerInfo?.data && typeof providerInfo.data === "object"
        ? (providerInfo.data as SocialProfile)
        : null;
    const providerUser =
      providerInfo?.user && typeof providerInfo.user === "object"
        ? (providerInfo.user as Record<string, unknown>)
        : null;

    const xAccountId =
      toNonEmptyString(socialProfile?.data?.id) ??
      toNonEmptyString(twitterAccount.accountId);
    const xUsername = toNonEmptyString(socialProfile?.data?.username);
    const xAvatar =
      toNonEmptyString(socialProfile?.data?.profile_image_url) ??
      toNonEmptyString(providerUser?.image) ??
      toNonEmptyString(providerUser?.picture);

    if (xAccountId) {
      await db
        .update(user)
        .set({
          xAccountId,
          ...(xUsername ? { xUsername } : {}),
          ...(xAvatar ? { image: xAvatar } : {}),
          xLinkedAt: now,
          updatedAt: now,
        })
        .where(eq(user.id, session.user.id));
    }
  } catch {
    // If any sync step fails, continue to profile without breaking callback flow.
  }

  return NextResponse.redirect(profileUrl(request));
}
