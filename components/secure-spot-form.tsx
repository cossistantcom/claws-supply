"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SecureSpotForm({ className }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    router.push(`/onboarding?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-w-0 flex-1 h-12 px-4 bg-background border-border font-pixel tracking-wider placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="lg"
          className="font-pixel text-xs tracking-wider px-8 h-12 shrink-0"
        >
          SECURE YOUR SPOT
        </Button>
      </div>
    </form>
  );
}
