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

  return "Unable to create your account right now.";
}

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleEmailSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      username,
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

  async function handleXSignUp() {
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
        <h1 className="font-pixel text-2xl">Sign Up</h1>
      </div>

      <form onSubmit={handleEmailSignUp} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs uppercase tracking-wide">
            Name
          </label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="username"
            className="text-xs uppercase tracking-wide"
          >
            Username
          </label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        onClick={handleXSignUp}
        disabled={isLoading}
        className="w-full"
      >
        Sign up with X
      </Button>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link className="underline" href="/auth/sign-in">
          Sign in
        </Link>
      </p>
    </main>
  );
}
