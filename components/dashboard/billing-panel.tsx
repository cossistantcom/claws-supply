"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { mapBillingPortalError } from "@/lib/onboarding/error-messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingPanelProps {
  organizationId: string;
  planLabel: string;
  status: string;
  nextPaymentDate: string | null;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BillingPanel({
  organizationId,
  planLabel,
  status,
  nextPaymentDate,
}: BillingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authClient.subscription.billingPortal({
        referenceId: organizationId,
        customerType: "organization",
        returnUrl: `${window.location.origin}/dashboard`,
        disableRedirect: true,
      });

      if (result.error) {
        setError(mapBillingPortalError(result.error));
        return;
      }

      const portalUrl = result.data?.url;
      if (!portalUrl) {
        setError("Stripe did not return a billing portal URL.");
        return;
      }

      window.location.assign(portalUrl);
    } catch (unknownError) {
      setError(mapBillingPortalError(unknownError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl border border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-pixel tracking-wider text-sm">
          BILLING
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-1">
              CURRENT PLAN
            </p>
            <p className="font-pixel text-sm">{planLabel}</p>
          </div>
          <div>
            <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-1">
              PAYMENT STATUS
            </p>
            <p className="font-pixel text-sm uppercase">{status}</p>
          </div>
          <div>
            <p className="font-pixel text-[10px] text-muted-foreground tracking-wider mb-1">
              NEXT PAYMENT
            </p>
            <p className="font-pixel text-sm">{formatDate(nextPaymentDate)}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-[11px] font-pixel tracking-wider">
            {error}
          </div>
        )}

        <Button
          onClick={() => {
            void handleManageBilling();
          }}
          size="lg"
          className="font-pixel text-xs tracking-wider h-11"
          disabled={loading}
        >
          {loading ? "OPENING..." : "MANAGE BILLING"}
        </Button>
      </CardContent>
    </Card>
  );
}
