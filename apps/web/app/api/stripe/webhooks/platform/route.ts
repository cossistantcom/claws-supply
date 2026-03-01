import { jsonSuccess } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/route-helpers";
import {
  parsePlatformStripeWebhookEvent,
  processPlatformStripeWebhookEvent,
} from "@/lib/ads/service";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    const rawBody = await request.text();
    const event = parsePlatformStripeWebhookEvent(rawBody, signature);

    await processPlatformStripeWebhookEvent(event);

    return jsonSuccess({
      received: true,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to process Stripe platform webhook.",
      code: "STRIPE_PLATFORM_WEBHOOK_ERROR",
      status: 400,
    });
  }
}
