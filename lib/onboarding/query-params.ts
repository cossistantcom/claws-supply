import {
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { TIER_ORDER } from "@/lib/pricing/types";

export const CHECKOUT_QUERY_VALUES = ["success", "cancel", "error"] as const;

export type CheckoutQueryValue = (typeof CHECKOUT_QUERY_VALUES)[number];

export const onboardingQueryParsers = {
  email: parseAsString.withDefault(""),
  checkout: parseAsStringLiteral(CHECKOUT_QUERY_VALUES),
  plan: parseAsStringLiteral(TIER_ORDER),
};

export type OnboardingQueryState = inferParserType<typeof onboardingQueryParsers>;

export function parseOnboardingQueryParams(
  searchParams: URLSearchParams,
): OnboardingQueryState {
  return {
    email: onboardingQueryParsers.email.parseServerSide(
      searchParams.get("email") ?? undefined,
    ),
    checkout: onboardingQueryParsers.checkout.parseServerSide(
      searchParams.get("checkout") ?? undefined,
    ),
    plan: onboardingQueryParsers.plan.parseServerSide(
      searchParams.get("plan") ?? undefined,
    ),
  };
}
