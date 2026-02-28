import { jsonSuccess } from "@/lib/api/response";
import { getBaseUrlFromRequest } from "@/lib/api/request";
import {
  handleRouteError,
  requireSessionOrThrow,
} from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { getCampaignByUserId } from "@/lib/ads/read-service";
import { createAdCampaignSchema } from "@/lib/ads/schemas";
import {
  cleanupExpiredCheckoutPendingCampaigns,
  createAdCampaignCheckout,
} from "@/lib/ads/service";

export async function GET(request: Request) {
  try {
    const session = await requireSessionOrThrow(request);
    await cleanupExpiredCheckoutPendingCampaigns();
    const campaign = await getCampaignByUserId(session.user.id);
    return jsonSuccess(campaign);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to load campaign.",
      code: "ADS_CAMPAIGN_FETCH_ERROR",
      status: 400,
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionOrThrow(request);
    const input = await parseJsonBodyWithSchema(request, createAdCampaignSchema);

    const result = await createAdCampaignCheckout({
      userId: session.user.id,
      input,
      baseUrl: getBaseUrlFromRequest(request),
    });

    return jsonSuccess(result, {
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create campaign checkout.",
      code: "ADS_CAMPAIGN_CREATE_ERROR",
      status: 400,
    });
  }
}
