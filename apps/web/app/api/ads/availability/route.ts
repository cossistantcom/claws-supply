import { jsonSuccess } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/route-helpers";
import { getAdAvailability } from "@/lib/ads/read-service";
import { cleanupExpiredCheckoutPendingCampaigns } from "@/lib/ads/service";

export async function GET() {
  try {
    await cleanupExpiredCheckoutPendingCampaigns();
    const availability = await getAdAvailability();
    return jsonSuccess(availability);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to load ad availability.",
      code: "ADS_AVAILABILITY_ERROR",
      status: 400,
    });
  }
}
