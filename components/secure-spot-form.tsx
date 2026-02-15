"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SecureSpotForm({ className }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Redirect to welcome page
      router.push("/welcome");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="flex-1 h-12 px-4 bg-background border border-border font-pixel text-xs tracking-wider placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground transition-colors"
        />
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="font-pixel text-xs tracking-wider px-8 h-12 shrink-0"
        >
          {loading ? "SECURING..." : "SECURE YOUR SPOT"}
        </Button>
      </div>
      {error && (
        <p className="text-[10px] text-red-400 font-pixel tracking-wider mt-2 text-center">
          {error}
        </p>
      )}
    </form>
  );
}
