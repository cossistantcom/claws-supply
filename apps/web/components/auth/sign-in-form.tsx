"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const FALLBACK_CALLBACK_URL = "/";

type SignInFormProps = {
  callbackURL: string;
};

function resolveErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to sign in right now.";
}

function buildXSyncCallbackUrl(nextPath: string): string {
  const params = new URLSearchParams({
    next: nextPath,
  });
  return `/api/profile/x/complete?${params.toString()}`;
}

export function SignInForm({ callbackURL }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const signUpHref = useMemo(() => {
    if (callbackURL === FALLBACK_CALLBACK_URL) {
      return "/auth/sign-up";
    }

    return `/auth/sign-up?next=${encodeURIComponent(callbackURL)}`;
  }, [callbackURL]);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL,
    });

    if (error) {
      setErrorMessage(resolveErrorMessage(error));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }

  async function handleXSignIn() {
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "twitter",
      callbackURL: buildXSyncCallbackUrl(callbackURL),
    });

    if (error) {
      setErrorMessage(resolveErrorMessage(error));
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6">
      <div className="space-y-2">
        <p className="font-pixel text-xs uppercase tracking-wider text-primary/80">
          Claws.supply
        </p>
        <h1 className="text-2xl">Sign In</h1>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs uppercase tracking-wide">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-wide"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        onClick={handleXSignIn}
        disabled={isLoading}
        className="w-full"
      >
        Continue with X
      </Button>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        New to Claws.supply?{" "}
        <Link className="underline" href={signUpHref}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
