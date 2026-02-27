import type { PricingSnapshot, TierName } from "@/lib/pricing/types";
import type { CheckoutQueryValue } from "./query-params";

export const ONBOARDING_STEPS = [
  "signup",
  "plan",
  "checkout_pending",
  "deploy",
] as const;

export type OnboardingCanonicalStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_INDEX: Record<OnboardingCanonicalStep, number> = {
  signup: 1,
  plan: 2,
  checkout_pending: 3,
  deploy: 4,
};

export interface OnboardingSubscriptionSummary {
  id: string;
  plan: TierName | string;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface OnboardingStateResponse {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  activeOrganizationId: string | null;
  hasActiveSubscription: boolean;
  subscription: OnboardingSubscriptionSummary | null;
  pricing: PricingSnapshot;
  allowedPlans: TierName[];
  canonicalStep: OnboardingCanonicalStep;
  checkoutHint: CheckoutQueryValue | null;
  updatedAt: string;
}

export function deriveOnboardingStep(input: {
  authenticated: boolean;
  hasActiveSubscription: boolean;
  checkoutHint: CheckoutQueryValue | null;
}): OnboardingCanonicalStep {
  if (!input.authenticated) {
    return "signup";
  }

  if (input.hasActiveSubscription) {
    return "deploy";
  }

  if (input.checkoutHint === "success") {
    return "checkout_pending";
  }

  return "plan";
}
