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
      assetType: "zip",
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create template upload token.",
      code: "TEMPLATE_UPLOAD_TOKEN_ERROR",
      status: 400,
    });
  }
}
