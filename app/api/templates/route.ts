import { jsonSuccess } from "@/lib/api/response";
import { handleRouteError, requireSessionOrThrow } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { createTemplateSchema } from "@/lib/templates/schemas";
import { createTemplateDraft } from "@/lib/templates/service";

export async function POST(request: Request) {
  try {
    const session = await requireSessionOrThrow(request);
    const input = await parseJsonBodyWithSchema(request, createTemplateSchema);
    const created = await createTemplateDraft(
      {
        id: session.user.id,
        role: session.user.role,
      },
      input,
    );

    return jsonSuccess(created, {
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to create template.",
      code: "TEMPLATE_CREATE_ERROR",
      status: 400,
    });
  }
}
