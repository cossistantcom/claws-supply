import { handleRouteError } from "@/lib/api/route-helpers";
import { handleAdsLogoUploadRoute } from "@/lib/ads/upload-route";

export async function POST(request: Request) {
  try {
    return await handleAdsLogoUploadRoute(request);
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create logo upload token.",
      code: "ADS_LOGO_UPLOAD_TOKEN_ERROR",
      status: 400,
    });
  }
}

