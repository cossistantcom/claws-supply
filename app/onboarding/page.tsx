import { headers } from "next/headers";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { auth } from "@/lib/auth-server";
import {
  parseOnboardingQueryParams,
  type OnboardingQueryState,
} from "@/lib/onboarding/query-params";
import { buildOnboardingState } from "@/lib/onboarding/state";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

function toUrlSearchParams(input: SearchParamsInput): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      params.set(key, value);
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value[0] ?? "");
    }
  }

  return params;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialQuery: OnboardingQueryState = parseOnboardingQueryParams(
    toUrlSearchParams(resolvedSearchParams),
  );

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const initialState = await buildOnboardingState({
    session,
    checkoutHint: initialQuery.checkout,
  });

  return (
    <OnboardingFlow
      initialState={initialState}
      initialQuery={initialQuery}
    />
  );
}
