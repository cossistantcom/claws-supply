"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/onboarding/error-messages";
import { ensureActiveOrganization } from "@/lib/onboarding/organization-client";

export function StepSignup({
  email: initialEmail,
  onComplete,
}: {
  email: string;
  onComplete: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignIn, setIsSignIn] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!isSignIn && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSignIn) {
        const { error: signInError } = await authClient.signIn.email({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          setError(extractErrorMessage(signInError, "Sign in failed"));
          return;
        }
        await ensureActiveOrganization(normalizedEmail);
        await onComplete();
        return;
      }

      const signUpResult = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name: normalizedEmail.split("@")[0] || "founder",
      });

      if (signUpResult.error) {
        const signUpMessage = extractErrorMessage(
          signUpResult.error,
          "Unable to create your account.",
        );

        if (signUpMessage.toLowerCase().includes("already exists")) {
          setIsSignIn(true);
          setError("Account exists. Sign in to continue.");
          return;
        }

        setError(signUpMessage);
        return;
      }

      await ensureActiveOrganization(normalizedEmail);
      await onComplete();
    } catch (unknownError) {
      const message = extractErrorMessage(
        unknownError,
        "Network error. Please try again.",
      );
      if (message.toLowerCase().includes("already exists")) {
        setIsSignIn(true);
        setError("Account exists. Sign in to continue.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-pixel text-2xl sm:text-3xl mb-4">
          {isSignIn ? "WELCOME BACK." : "CREATE ACCOUNT."}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isSignIn
            ? "Sign in to continue your onboarding."
            : "Set your password to get started."}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-pixel tracking-wider text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-pixel text-[10px] tracking-wider text-muted-foreground mb-1.5">
            EMAIL
          </label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full h-11 px-4 bg-background border-border font-pixel tracking-wider placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0"
          />
        </div>

        <div>
          <label className="block font-pixel text-[10px] tracking-wider text-muted-foreground mb-1.5">
            PASSWORD
          </label>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="Min 8 characters"
            className="w-full h-11 px-4 bg-background border-border font-pixel tracking-wider placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0"
          />
        </div>

        {!isSignIn && (
          <div>
            <label className="block font-pixel text-[10px] tracking-wider text-muted-foreground mb-1.5">
              CONFIRM PASSWORD
            </label>
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Repeat password"
              className="w-full h-11 px-4 bg-background border-border font-pixel tracking-wider placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0"
            />
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full font-pixel text-xs tracking-wider h-12 mt-2"
        >
          {loading
            ? "LOADING..."
            : isSignIn
              ? "SIGN IN"
              : "CREATE ACCOUNT"}
        </Button>
      </form>

      <p className="text-center mt-4">
        <button
          type="button"
          onClick={() => {
            setIsSignIn(!isSignIn);
            setError(null);
          }}
          className="text-[10px] text-muted-foreground font-pixel tracking-wider hover:text-foreground transition-colors"
        >
          {isSignIn
            ? "NEED AN ACCOUNT? SIGN UP"
            : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
        </button>
      </p>
    </div>
  );
}
