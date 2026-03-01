import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSessionFromNextHeaders } from "@/lib/auth/session";
import { buildNoindexMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

const DEFAULT_REDIRECT_PATH = "/profile";

export const metadata: Metadata = buildNoindexMetadata({
  title: "Create Account — Claws.supply",
  description: "Create a Claws.supply account to buy, publish, and manage OpenClaw templates.",
  path: "/auth/sign-up",
});

type SignUpSearchParams = {
  next?: string | string[];
};

type SignUpPageProps = {
  searchParams: Promise<SignUpSearchParams>;
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

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [session, params] = await Promise.all([
    getSessionFromNextHeaders(),
    searchParams,
  ]);
  const nextParam = getFirstValue(params.next);
  const callbackURL = resolveSafeRedirectPath(nextParam ?? null);

  if (session) {
    redirect(callbackURL);
  }

  return <SignUpForm callbackURL={callbackURL} />;
}
