import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { auth } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const DEFAULT_REDIRECT_PATH = "/profile";

type SocialProfile = {
  data?: {
    id?: unknown;
    username?: unknown;
    profile_image_url?: unknown;
  };
};

function readSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headersWithSetCookie.getSetCookie === "function") {
    return headersWithSetCookie.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? [setCookieHeader] : [];
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSafeRedirectPath(candidate: string | null): string {
  if (!candidate) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return candidate;
}

function resolveRedirectUrl(request: Request): URL {
  const nextParam = new URL(request.url).searchParams.get("next");
  const safePath = resolveSafeRedirectPath(nextParam);
  return new URL(safePath, request.url);
}

export async function GET(request: Request) {
  const redirectUrl = resolveRedirectUrl(request);
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  const response = NextResponse.redirect(redirectUrl);

  try {
    const linkedAccounts = await auth.api.listUserAccounts({
      headers: request.headers,
    });
    const twitterAccount = linkedAccounts.find(
      (account) => account.providerId === "twitter",
    );

    if (!twitterAccount) {
      console.warn("[x-sync] linked twitter account missing after callback", {
        userId: session.user.id,
      });
      return response;
    }

    let providerInfo: Awaited<ReturnType<typeof auth.api.accountInfo>> = null;

    try {
      providerInfo = await auth.api.accountInfo({
        headers: request.headers,
        query: {
          accountId: twitterAccount.id,
        },
      });
    } catch (error) {
      console.warn("[x-sync] unable to read twitter account info", {
        userId: session.user.id,
        accountId: twitterAccount.id,
        error: error instanceof Error ? error.message : "unknown_error",
      });
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
          xLinkedAt: now,
          updatedAt: now,
        })
        .where(eq(user.id, session.user.id));
    }
    if (!xAvatar) {
      console.warn("[x-sync] avatar sync skipped: no profile image returned", {
        userId: session.user.id,
        accountId: twitterAccount.id,
      });
      return response;
    }

    try {
      const updateResult = await auth.api.updateUser({
        headers: request.headers,
        body: {
          image: xAvatar,
        },
        returnHeaders: true,
      });
      const updateHeaders =
        updateResult &&
        typeof updateResult === "object" &&
        "headers" in updateResult &&
        updateResult.headers instanceof Headers
          ? updateResult.headers
          : null;

      if (updateHeaders) {
        const setCookieHeaders = readSetCookieHeaders(updateHeaders);

        for (const setCookieHeader of setCookieHeaders) {
          response.headers.append("set-cookie", setCookieHeader);
        }
      }
    } catch (error) {
      console.warn("[x-sync] avatar sync failed", {
        userId: session.user.id,
        accountId: twitterAccount.id,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  } catch (error) {
    console.error("[x-sync] callback sync failed", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    // If any sync step fails, continue to profile without breaking callback flow.
  }

  return response;
}
