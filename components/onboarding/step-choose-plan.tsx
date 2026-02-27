"use client";

import { useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { mapCheckoutError } from "@/lib/onboarding/error-messages";
import { ensureActiveOrganization } from "@/lib/onboarding/organization-client";
import type { PricingSnapshot, TierName } from "@/lib/pricing/types";
import { Button } from "@/components/ui/button";
import { SpotsCounter } from "@/components/spots-counter";

interface StepChoosePlanProps {
  pricing: PricingSnapshot;
  selectedPlan: TierName | null;
  email: string;
  statusMessage?: string | null;
  onPlanSelected: (plan: TierName) => void;
  onCheckoutError: (message: string) => void;
}

export function StepChoosePlan({
  pricing,
  email,
  statusMessage,
  onPlanSelected,
  onCheckoutError,
}: StepChoosePlanProps) {
  const [loadingPlan, setLoadingPlan] = useState<TierName | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = useMemo(
    () => pricing.order.map((name) => pricing.tiers[name]),
    [pricing.order, pricing.tiers],
  );
  const integrityMessage =
    pricing.integrityStatus === "degraded"
      ? "Discounted tiers are temporarily unavailable. Final tier checkout remains open."
      : null;

  const handleSelectPlan = async (planName: TierName) => {
    setLoadingPlan(planName);
    setError(null);
    onPlanSelected(planName);
    let redirecting = false;

    const failCheckout = (message: string) => {
      setError(message);
      onCheckoutError(message);
    };

    try {
      const organizationId = await ensureActiveOrganization(email);
      const successUrl = `${window.location.origin}/onboarding?checkout=success`;
      const cancelUrl = `${window.location.origin}/onboarding?checkout=cancel`;
      const returnUrl = `${window.location.origin}/dashboard`;

      const result = await authClient.subscription.upgrade({
        plan: planName,
        referenceId: organizationId,
        customerType: "organization",
        successUrl,
        cancelUrl,
        returnUrl,
        disableRedirect: true,
      });

      if (result.error) {
        failCheckout(mapCheckoutError(result.error));
        return;
      }

      const stripeUrl = result.data?.url;
      if (!stripeUrl) {
        failCheckout("Stripe session did not return a checkout URL.");
        return;
      }

      redirecting = true;
      window.location.assign(stripeUrl);
    } catch (unknownError) {
      failCheckout(mapCheckoutError(unknownError));
    } finally {
      if (!redirecting) {
        setLoadingPlan(null);
      }
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-pixel text-2xl sm:text-3xl mb-4">
          CHOOSE YOUR PLAN.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          One service. Three prices. Early operators lock in lower rates
          forever.
        </p>
      </div>

      {(integrityMessage || statusMessage || error) && (
        <div className="mb-6 p-3 border border-foreground/20 bg-foreground/[0.03] text-foreground/90 text-xs font-pixel tracking-wider text-center">
          {error ?? statusMessage ?? integrityMessage}
        </div>
      )}

      <div className="space-y-3">
        {plans.map((plan) => {
          const isSelectable = plan.selectable;
          const isPrimary = plan.isCurrentDiscountTier && isSelectable;

          return (
            <div
              key={plan.name}
              className={
                isPrimary
                  ? "border border-dashed p-6 space-y-6"
                  : isSelectable
                    ? "border p-6 space-y-6"
                    : "border p-6 opacity-55 space-y-6"
              }
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="font-pixel text-xs tracking-wider">
                    {plan.label}
                  </span>

                  {isSelectable && (
                    <SpotsCounter
                      total={plan.spotsCap}
                      taken={plan.taken + (plan.name === "founding" ? 3 : 0)}
                      className="ml-6"
                    />
                  )}
                </div>
                <span className="font-pixel text-xl">
                  ${plan.monthlyPrice}/mo
                </span>
              </div>

              {isSelectable && (
                <Button
                  size="lg"
                  className="w-full font-pixel text-xs tracking-wider h-11"
                  variant={isPrimary ? "default" : "outline"}
                  disabled={!isSelectable || loadingPlan !== null}
                  onClick={() => handleSelectPlan(plan.name)}
                >
                  {loadingPlan === plan.name
                    ? "REDIRECTING TO STRIPE..."
                    : !isSelectable
                      ? "LOCKED"
                      : "SUBSCRIBE NOW"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-6 font-pixel tracking-wider text-center">
        SECURE CHECKOUT VIA STRIPE / CANCEL ANYTIME
      </p>
    </div>
  );
}
