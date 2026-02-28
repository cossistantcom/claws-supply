export const AD_SLOT_LIMIT = 30;
export const AD_CHECKOUT_PENDING_TTL_MINUTES = 30;
export const AD_RESULTS_INSERT_EVERY = 8;
export const AD_RESULTS_MAX_INSERTIONS = 2;

export const AD_PLAN_PRICING_CENTS = {
  sidebar: 49_900,
  results: 69_900,
  both: 99_900,
} as const;

export const STRIPE_AD_PRICE_IDS = {
  sandbox: {
    sidebar: "price_sandbox_sidebar",
    results: "price_sandbox_results",
    both: "price_sandbox_both",
  },
  production: {
    sidebar: "price_production_sidebar",
    results: "price_production_results",
    both: "price_production_both",
  },
} as const;

export type StripePriceEnvironment = keyof typeof STRIPE_AD_PRICE_IDS;

export function resolveStripePriceEnvironment(): StripePriceEnvironment {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return secretKey.startsWith("sk_live_") ? "production" : "sandbox";
}

export function getResolvedStripeAdPriceIds() {
  return {
    sandbox: {
      sidebar:
        process.env.STRIPE_AD_PRICE_SIDEBAR_SANDBOX ??
        STRIPE_AD_PRICE_IDS.sandbox.sidebar,
      results:
        process.env.STRIPE_AD_PRICE_RESULTS_SANDBOX ??
        STRIPE_AD_PRICE_IDS.sandbox.results,
      both:
        process.env.STRIPE_AD_PRICE_BOTH_SANDBOX ??
        STRIPE_AD_PRICE_IDS.sandbox.both,
    },
    production: {
      sidebar:
        process.env.STRIPE_AD_PRICE_SIDEBAR_PRODUCTION ??
        STRIPE_AD_PRICE_IDS.production.sidebar,
      results:
        process.env.STRIPE_AD_PRICE_RESULTS_PRODUCTION ??
        STRIPE_AD_PRICE_IDS.production.results,
      both:
        process.env.STRIPE_AD_PRICE_BOTH_PRODUCTION ??
        STRIPE_AD_PRICE_IDS.production.both,
    },
  } as const;
}

