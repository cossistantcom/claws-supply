"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    name: "founding" as const,
    label: "FOUNDING 50",
    price: "$299",
    badge: "NOW OPEN",
    active: true,
    features: [
      "Dedicated growth engine",
      "Daily qualified leads",
      "Strategy call with founder",
      "Rate locked permanently",
    ],
  },
  {
    name: "next" as const,
    label: "NEXT 50",
    price: "$449",
    badge: null,
    active: false,
    features: [
      "Dedicated growth engine",
      "Daily qualified leads",
      "Strategy call with founder",
      "Priority support",
    ],
  },
  {
    name: "final" as const,
    label: "FINAL 50",
    price: "$799",
    badge: null,
    active: false,
    features: [
      "Dedicated growth engine",
      "Daily qualified leads",
      "Strategy call with founder",
      "Priority support",
      "Custom integrations",
    ],
  },
];

export default function ChoosePlanPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planName: string) => {
    setLoading(planName);
    setError(null);

    try {
      // Get active org to use as referenceId
      const { data: activeOrg } = await authClient.organization.getFullOrganization();

      if (!activeOrg?.id) {
        setError("No organization found. Please contact support.");
        setLoading(null);
        return;
      }

      // Create Stripe checkout session via Better Auth
      await authClient.subscription.upgrade({
        plan: planName,
        referenceId: activeOrg.id,
        customerType: "organization",
        successUrl: `${window.location.origin}/choose-plan?success=true`,
        cancelUrl: `${window.location.origin}/choose-plan`,
      });
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl w-full">
      <div className="text-center mb-10">
        <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-3">
          STEP 1 OF 3
        </p>
        <h1 className="font-pixel text-2xl sm:text-3xl mb-4">
          CHOOSE YOUR PLAN.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          All plans include the same core service. Early founders lock in lower
          rates permanently.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-pixel tracking-wider text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.active
                ? "border-2 border-foreground p-6"
                : "border border-border p-6 opacity-50"
            }
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <span className="font-pixel text-xs tracking-wider">
                  {plan.label}
                </span>
                {plan.badge && (
                  <Badge
                    variant="outline"
                    className="font-pixel text-[9px] tracking-wider"
                  >
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <span className="font-pixel text-xl">{plan.price}/mo</span>
            </div>

            <ul className="space-y-1.5 mb-5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="text-xs text-muted-foreground flex items-center gap-2"
                >
                  <span className="text-foreground/40">+</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full font-pixel text-xs tracking-wider h-11"
              variant={plan.active ? "default" : "outline"}
              disabled={!plan.active || loading !== null}
              onClick={() => handleSelectPlan(plan.name)}
            >
              {loading === plan.name
                ? "REDIRECTING..."
                : plan.active
                  ? "SELECT PLAN"
                  : "COMING SOON"}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-6 font-pixel tracking-wider text-center">
        SECURE CHECKOUT VIA STRIPE / CANCEL ANYTIME
      </p>
    </div>
  );
}
