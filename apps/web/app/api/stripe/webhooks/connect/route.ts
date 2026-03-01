import { jsonSuccess } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/route-helpers";
import {
  parseConnectStripeWebhookEvent,
  processConnectStripeWebhookEvent,
} from "@/lib/stripe-connect-webhooks";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const rawBody = await request.text();
    const event = parseConnectStripeWebhookEvent(rawBody, signature);

    await processConnectStripeWebhookEvent(event);

    return jsonSuccess({
      received: true,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to process Stripe connect webhook.",
      code: "STRIPE_CONNECT_WEBHOOK_ERROR",
      status: 400,
    });
  }
}
