import { handleRouteError, parseSlugParams, requireSessionOrThrow } from "@/lib/api/route-helpers";
import { getTemplateDownloadForActor } from "@/lib/templates/service";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function escapeFilename(value: string): string {
  return value.replace(/["\\\r\n]/g, "_");
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionOrThrow(request);
    const slug = await parseSlugParams(context.params);
    const download = await getTemplateDownloadForActor(
      {
        id: session.user.id,
        role: session.user.role,
      },
      slug,
    );

    return new Response(download.stream, {
      status: 200,
      headers: {
        "Content-Type": download.contentType,
        "Content-Disposition": `attachment; filename="${escapeFilename(download.fileName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(download.size !== null
          ? {
              "Content-Length": String(download.size),
            }
          : {}),
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to download template.",
      code: "TEMPLATE_DOWNLOAD_ERROR",
      status: 400,
    });
  }
}
