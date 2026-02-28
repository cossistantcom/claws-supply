import { handleRouteError } from "@/lib/api/route-helpers";
import { handleTemplateUploadRoute } from "@/lib/templates/upload-route";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    return await handleTemplateUploadRoute({
      request,
      context,
      assetType: "cover",
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create cover upload token.",
      code: "COVER_UPLOAD_TOKEN_ERROR",
      status: 400,
    });
  }
}
