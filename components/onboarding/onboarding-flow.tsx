"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/onboarding/error-messages";
import { onboardingQueryParsers, type OnboardingQueryState } from "@/lib/onboarding/query-params";
import { ONBOARDING_STEP_INDEX, type OnboardingStateResponse } from "@/lib/onboarding/types";
import { StepChoosePlan } from "./step-choose-plan";
import { StepCheckoutSuccess } from "./step-checkout-success";
import { StepDeployAgent } from "./step-deploy-agent";
import { OnboardingShell } from "./onboarding-shell";
import { StepSignup } from "./step-signup";
import type { CheckoutQueryValue } from "@/lib/onboarding/query-params";
import type { TierName } from "@/lib/pricing/types";

const POLL_DELAY_MS = 2_500;
const MAX_CHECKOUT_POLL_ATTEMPTS = 8;
const CHECKOUT_HINT_MESSAGES = {
  cancel: "Checkout canceled. Pick a plan to continue.",
  error: "Checkout failed. Please retry.",
  success: "Payment received. Confirming subscription activation...",
} as const;
const DELAYED_ACTIVATION_MESSAGE =
  "Activation is taking longer than expected. You can retry status or return to plans.";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOnboardingState(
  checkoutHint: CheckoutQueryValue | null,
): Promise<OnboardingStateResponse> {
  const params = new URLSearchParams();
  if (checkoutHint) {
    params.set("checkout", checkoutHint);
  }

  const query = params.toString();
  const endpoint = query
    ? `/api/onboarding/state?${query}`
    : "/api/onboarding/state";
  const response = await fetch(endpoint, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("State endpoint returned an error.");
  }

  return (await response.json()) as OnboardingStateResponse;
}

export function OnboardingFlow({
  initialState,
  initialQuery,
}: {
  initialState: OnboardingStateResponse;
  initialQuery: OnboardingQueryState;
}) {
  const [query, setQuery] = useQueryStates(onboardingQueryParsers);
  const [state, setState] = useState<OnboardingStateResponse>(initialState);
  const [polling, setPolling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const operationIdRef = useRef(0);
  const initialCheckoutHintRef = useRef<CheckoutQueryValue | null>(
    initialQuery.checkout,
  );

  const startOperation = useCallback(() => {
    operationIdRef.current += 1;
    return operationIdRef.current;
  }, []);

  const isOperationCurrent = useCallback((operationId: number) => {
    return operationIdRef.current === operationId;
  }, []);

  const clearCheckoutHint = useCallback(async () => {
    await setQuery(
      {
        checkout: null,
      },
      {
        history: "replace",
        scroll: false,
      },
    );
  }, [setQuery]);

  const refreshState = useCallback(
    async (checkoutHint: CheckoutQueryValue | null) => {
      const next = await fetchOnboardingState(checkoutHint);
      setState(next);
      return next;
    },
    [],
  );

  const syncState = useCallback(async () => {
    const operationId = startOperation();
    setSyncing(true);
    setFatalError(null);

    try {
      const next = await refreshState(null);
      if (!isOperationCurrent(operationId)) {
        return;
      }
      if (next.canonicalStep !== "plan") {
        setPlanMessage(null);
      }
    } catch (unknownError) {
      if (!isOperationCurrent(operationId)) {
        return;
      }
      setFatalError(
        extractErrorMessage(unknownError, "Unable to load onboarding state."),
      );
    } finally {
      if (isOperationCurrent(operationId)) {
        setSyncing(false);
      }
    }
  }, [isOperationCurrent, refreshState, startOperation]);

  const clearCheckoutHintAndRefresh = useCallback(
    async (operationId: number) => {
      await clearCheckoutHint();
      if (!isOperationCurrent(operationId)) {
        return;
      }
      await refreshState(null);
    },
    [clearCheckoutHint, isOperationCurrent, refreshState],
  );

  const handleCheckoutHint = useCallback(
    async (checkoutHint: CheckoutQueryValue) => {
      const operationId = startOperation();
      setFatalError(null);

      if (checkoutHint !== "success") {
        setPlanMessage(CHECKOUT_HINT_MESSAGES[checkoutHint]);
        try {
          await clearCheckoutHintAndRefresh(operationId);
        } catch (unknownError) {
          if (isOperationCurrent(operationId)) {
            setFatalError(
              extractErrorMessage(unknownError, "Unable to load onboarding state."),
            );
          }
        }
        return;
      }

      setPolling(true);
      setPlanMessage(CHECKOUT_HINT_MESSAGES.success);

      try {
        for (let attempt = 0; attempt < MAX_CHECKOUT_POLL_ATTEMPTS; attempt += 1) {
          await sleep(POLL_DELAY_MS);
          if (!isOperationCurrent(operationId)) {
            return;
          }

          const next = await refreshState("success");
          if (!isOperationCurrent(operationId)) {
            return;
          }

          if (next.canonicalStep === "deploy") {
            setPlanMessage(null);
            await clearCheckoutHint();
            return;
          }
        }

        if (!isOperationCurrent(operationId)) {
          return;
        }

        setPlanMessage(DELAYED_ACTIVATION_MESSAGE);
        await clearCheckoutHintAndRefresh(operationId);
      } catch (unknownError) {
        if (!isOperationCurrent(operationId)) {
          return;
        }
        setFatalError(
          extractErrorMessage(unknownError, "Unable to load onboarding state."),
        );
      } finally {
        if (isOperationCurrent(operationId)) {
          setPolling(false);
        }
      }
    },
    [
      clearCheckoutHintAndRefresh,
      isOperationCurrent,
      clearCheckoutHint,
      refreshState,
      startOperation,
    ],
  );

  useEffect(() => {
    const checkoutHint = query.checkout ?? initialCheckoutHintRef.current;
    if (!checkoutHint) {
      return;
    }

    initialCheckoutHintRef.current = null;
    void handleCheckoutHint(checkoutHint);
  }, [handleCheckoutHint, query.checkout]);

  useEffect(() => {
    return () => {
      operationIdRef.current += 1;
    };
  }, []);

  const currentStep = ONBOARDING_STEP_INDEX[state.canonicalStep];

  async function handleSignupComplete() {
    await syncState();
  }

  async function handleCheckoutError(message: string) {
    setPlanMessage(message);
    await clearCheckoutHint();
  }

  async function handleBackToPlan() {
    await clearCheckoutHint();
    await syncState();
  }

  async function handleManualRefresh() {
    await syncState();
  }

  async function handlePlanSelected(plan: TierName) {
    setPlanMessage(null);
    await setQuery(
      {
        plan,
      },
      {
        history: "replace",
        scroll: false,
      },
    );
  }

  const selectedPlan = query.plan ?? initialQuery.plan;
  const email = query.email || initialQuery.email || state.email || "";

  return (
    <OnboardingShell currentStep={currentStep}>
      {fatalError && (
        <div className="max-w-sm w-full mx-auto text-center">
          <p className="font-pixel text-xl mb-4">ONBOARDING ERROR</p>
          <p className="text-xs text-muted-foreground mb-6">{fatalError}</p>
          <Button
            onClick={() => {
              void syncState();
            }}
            className="font-pixel text-xs tracking-wider"
            disabled={syncing || polling}
          >
            RETRY
          </Button>
        </div>
      )}

      {!fatalError && state.canonicalStep === "signup" && (
        <StepSignup email={email} onComplete={handleSignupComplete} />
      )}

      {!fatalError && state.canonicalStep === "plan" && (
        <StepChoosePlan
          pricing={state.pricing}
          selectedPlan={selectedPlan}
          email={email}
          statusMessage={planMessage}
          onPlanSelected={(plan) => {
            void handlePlanSelected(plan);
          }}
          onCheckoutError={(message) => {
            void handleCheckoutError(message);
          }}
        />
      )}

      {!fatalError && state.canonicalStep === "checkout_pending" && (
        <StepCheckoutSuccess
          isPolling={polling || syncing}
          message={planMessage}
          onRefresh={handleManualRefresh}
          onBackToPlan={handleBackToPlan}
        />
      )}

      {!fatalError && state.canonicalStep === "deploy" && <StepDeployAgent />}
    </OnboardingShell>
  );
}
