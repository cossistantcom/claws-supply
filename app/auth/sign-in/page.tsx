"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const CALLBACK_URL = "/";

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

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: CALLBACK_URL,
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
      callbackURL: CALLBACK_URL,
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
        <h1 className="font-pixel text-2xl">Sign In</h1>
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
        <Link className="underline" href="/auth/sign-up">
          Create an account
        </Link>
      </p>
    </main>
  );
}
