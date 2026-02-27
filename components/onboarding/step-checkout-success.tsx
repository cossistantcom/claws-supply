"use client";

import { Button } from "@/components/ui/button";

export function StepCheckoutSuccess({
  isPolling,
  message,
  onRefresh,
  onBackToPlan,
}: {
  isPolling: boolean;
  message: string | null;
  onRefresh: () => Promise<void> | void;
  onBackToPlan: () => Promise<void> | void;
}) {
  return (
    <div className="max-w-sm w-full mx-auto text-center">
      <div className="mb-8">
        <p className="font-pixel text-4xl mb-6">&#x23F3;</p>
        <h1 className="font-pixel text-2xl sm:text-3xl mb-4">
          CONFIRMING PAYMENT.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Stripe accepted your checkout. We&apos;re waiting for subscription
          activation.
        </p>
        {message && (
          <p className="text-[11px] text-foreground/80 font-pixel tracking-wider mt-4">
            {message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Button
          size="lg"
          onClick={onRefresh}
          className="font-pixel text-xs tracking-wider px-10 h-12 w-full"
          disabled={isPolling}
        >
          {isPolling ? "SYNCING..." : "CHECK STATUS"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onBackToPlan}
          className="font-pixel text-xs tracking-wider px-10 h-12 w-full"
          disabled={isPolling}
        >
          BACK TO PLANS
        </Button>
      </div>
    </div>
  );
}
