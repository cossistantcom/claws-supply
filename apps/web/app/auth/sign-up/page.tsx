import { SignUpForm } from "@/components/auth/sign-up-form";

const DEFAULT_REDIRECT_PATH = "/profile";

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
  const params = await searchParams;
  const nextParam = getFirstValue(params.next);
  const callbackURL = resolveSafeRedirectPath(nextParam ?? null);

  return <SignUpForm callbackURL={callbackURL} />;
}
