import { jsonSuccess } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseStripeWebhookEvent, processStripeWebhookEvent } from "@/lib/ads/service";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const rawBody = await request.text();
    const event = parseStripeWebhookEvent(rawBody, signature);

    await processStripeWebhookEvent(event);

    return jsonSuccess({
      received: true,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to process Stripe webhook.",
      code: "STRIPE_WEBHOOK_ERROR",
      status: 400,
    });
  }
}

