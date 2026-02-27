import Stripe from "stripe";
import { getBetterAuthPlans } from "./pricing/config";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return stripeClient;
}

export { getBetterAuthPlans };
export type { TierName } from "./pricing/types";
