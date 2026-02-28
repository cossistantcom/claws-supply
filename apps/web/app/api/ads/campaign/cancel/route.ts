import { jsonSuccess } from "@/lib/api/response";
import { handleRouteError, requireSessionOrThrow } from "@/lib/api/route-helpers";
import { cancelAdCampaignForUser } from "@/lib/ads/service";

export async function POST(request: Request) {
  try {
    const session = await requireSessionOrThrow(request);
    const result = await cancelAdCampaignForUser(session.user.id);
    return jsonSuccess(result);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to cancel campaign.",
      code: "ADS_CAMPAIGN_CANCEL_ERROR",
      status: 400,
    });
  }
}

