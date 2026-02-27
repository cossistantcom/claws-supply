import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HourglassLogo } from "@/components/hourglass-logo";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { BotDeployPanel } from "@/components/dashboard/bot-deploy-panel";
import { auth } from "@/lib/auth-server";
import {
  getOrganizationSubscriptions,
  hasActiveOrTrialingSubscription,
  resolveActiveOrganizationId,
  selectCurrentSubscription,
} from "@/lib/billing/subscription-state";
import { getTierConfig } from "@/lib/pricing/config";
import type { TierName } from "@/lib/pricing/types";

function isTierName(value: string): value is TierName {
  return value === "founding" || value === "next" || value === "final";
}

function resolvePlanLabel(plan: string): string {
  if (isTierName(plan)) {
    return `${getTierConfig(plan).label} / $${getTierConfig(plan).monthlyPrice}`;
  }
  return plan.toUpperCase();
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session || !session.user?.id) {
    redirect("/onboarding");
  }

  const activeOrganizationId = await resolveActiveOrganizationId({
    userId: session.user.id,
    sessionActiveOrganizationId: session.session.activeOrganizationId,
  });

  if (!activeOrganizationId) {
    redirect("/onboarding");
  }

  const subscriptions =
    await getOrganizationSubscriptions(activeOrganizationId);
  const hasActiveSubscription = hasActiveOrTrialingSubscription(subscriptions);
  const currentSubscription = selectCurrentSubscription(subscriptions);

  if (!currentSubscription || !hasActiveSubscription) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center gap-3">
          <HourglassLogo pixelSize={3} />
          <div>
            <p className="font-pixel text-sm tracking-wider">claws.supply</p>
            <p className="text-xs text-muted-foreground">
              Subscription and billing
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <BillingPanel
            organizationId={activeOrganizationId}
            planLabel={resolvePlanLabel(currentSubscription.plan)}
            status={currentSubscription.status}
            nextPaymentDate={
              currentSubscription.periodEnd?.toISOString() ?? null
            }
          />
          <BotDeployPanel />
        </div>
      </div>
    </div>
  );
}
