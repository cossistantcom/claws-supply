import { handleRouteError, parseSlugParams } from "@/lib/api/route-helpers";
import { getSessionFromRequest } from "@/lib/auth/session";
import { requireCliActorFromBearer } from "@/lib/cli/auth";
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
    const slug = await parseSlugParams(context.params);
    const session = await getSessionFromRequest(request);

    let actor: {
      id: string;
      role?: string | null;
    } | null = null;

    if (session) {
      actor = {
        id: session.user.id,
        role: session.user.role,
      };
    } else if (request.headers.get("authorization")) {
      const cliActor = await requireCliActorFromBearer(request);
      actor = {
        id: cliActor.id,
        role: cliActor.role,
      };
    }

    const download = await getTemplateDownloadForActor(
      actor,
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
