import {
  getOrganizationSubscriptions,
  hasActiveOrTrialingSubscription,
  resolveActiveOrganizationId,
  selectCurrentSubscription,
  type SubscriptionRecord,
} from "@/lib/billing/subscription-state";
import { getPricingSnapshot } from "@/lib/pricing/service";
import { deriveOnboardingStep, type OnboardingStateResponse } from "./types";
import type { CheckoutQueryValue } from "./query-params";

interface SessionShape {
  user: {
    id: string;
    email: string;
  };
  session: {
    activeOrganizationId?: string | null;
  };
}

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function buildOnboardingState(input: {
  session: SessionShape | null;
  checkoutHint: CheckoutQueryValue | null;
}): Promise<OnboardingStateResponse> {
  const pricing = await getPricingSnapshot();

  if (!input.session?.session || !input.session.user?.id) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      activeOrganizationId: null,
      hasActiveSubscription: false,
      subscription: null,
      pricing,
      allowedPlans: pricing.allowedPlans,
      canonicalStep: deriveOnboardingStep({
        authenticated: false,
        hasActiveSubscription: false,
        checkoutHint: input.checkoutHint,
      }),
      checkoutHint: input.checkoutHint,
      updatedAt: new Date().toISOString(),
    };
  }

  const userId = input.session.user.id;
  const activeOrganizationId = await resolveActiveOrganizationId({
    userId,
    sessionActiveOrganizationId: input.session.session.activeOrganizationId,
  });

  let currentSubscription: SubscriptionRecord | null = null;
  let hasActiveSubscription = false;

  if (activeOrganizationId) {
    const subscriptions = await getOrganizationSubscriptions(activeOrganizationId);
    currentSubscription = selectCurrentSubscription(subscriptions);
    hasActiveSubscription = hasActiveOrTrialingSubscription(subscriptions);
  }

  return {
    authenticated: true,
    userId,
    email: input.session.user.email,
    activeOrganizationId,
    hasActiveSubscription,
    subscription: currentSubscription
      ? {
          id: currentSubscription.id,
          plan: currentSubscription.plan,
          status: currentSubscription.status,
          periodStart: toIsoString(currentSubscription.periodStart),
          periodEnd: toIsoString(currentSubscription.periodEnd),
          trialStart: toIsoString(currentSubscription.trialStart),
          trialEnd: toIsoString(currentSubscription.trialEnd),
          cancelAtPeriodEnd: currentSubscription.cancelAtPeriodEnd,
        }
      : null,
    pricing,
    allowedPlans: pricing.allowedPlans,
    canonicalStep: deriveOnboardingStep({
      authenticated: true,
      hasActiveSubscription,
      checkoutHint: input.checkoutHint,
    }),
    checkoutHint: input.checkoutHint,
    updatedAt: new Date().toISOString(),
  };
}
