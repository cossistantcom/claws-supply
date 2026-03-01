import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { buildNoindexMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

const DEFAULT_REDIRECT_PATH = "/profile";

export const metadata: Metadata = buildNoindexMetadata({
  title: "Sign In — Claws.supply",
  description: "Sign in to access your Claws.supply account and template workspace.",
  path: "/auth/sign-in",
});

type SignInSearchParams = {
  next?: string | string[];
};

type SignInPageProps = {
  searchParams: Promise<SignInSearchParams>;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
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

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [session, params] = await Promise.all([
    getSessionFromNextHeaders(),
    searchParams,
  ]);
  const nextParam = getFirstValue(params.next);
  const callbackURL = resolveSafeRedirectPath(nextParam ?? null);

  if (session) {
    redirect(callbackURL);
  }

  return <SignInForm callbackURL={callbackURL} />;
}
