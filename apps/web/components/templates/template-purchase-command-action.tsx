"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CreatePurchaseCheckoutResponse } from "@/lib/purchases/types";
import { cn } from "@/lib/utils";

type TemplatePurchaseCommandActionProps = {
  templateSlug: string;
  priceLabel: string;
  className?: string;
};

type ApiSuccess<T> = {
  data: T;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

function resolveErrorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (
    payload &&
    payload.error &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim().length > 0
  ) {
    return payload.error.message;
  }

  return fallback;
}

export function TemplatePurchaseCommandAction({
  templateSlug,
  priceLabel,
  className,
}: TemplatePurchaseCommandActionProps) {
  const [isPending, setIsPending] = useState(false);

  async function handlePurchase() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/purchases/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateSlug,
        }),
      });

      let payload: ApiSuccess<CreatePurchaseCheckoutResponse> | ApiErrorPayload | null = null;
      try {
        payload = (await response.json()) as
          | ApiSuccess<CreatePurchaseCheckoutResponse>
          | ApiErrorPayload;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(
          resolveErrorMessage(payload as ApiErrorPayload | null, "Unable to start checkout."),
        );
      }

      if (!payload || typeof payload !== "object" || !("data" in payload)) {
        throw new Error("Invalid API response.");
      }

      const result = payload.data;
      if (result.flow === "paid") {
        window.location.assign(result.checkoutUrl);
        return;
      }

      window.location.reload();
    } catch (error) {
      setIsPending(false);
      toast.error(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to start checkout.",
      );
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handlePurchase}
      disabled={isPending}
      className={cn("shrink-0 whitespace-nowrap", className)}
    >
      {isPending ? (
        <>
          <Loader2Icon className="animate-spin" />
          Redirecting...
        </>
      ) : (
        `Purchase for ${priceLabel}`
      )}
    </Button>
  );
}
