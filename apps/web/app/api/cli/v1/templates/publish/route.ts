import { getBaseUrlFromRequest } from "@/lib/api/request";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { enforceCliPublishRateLimit } from "@/lib/api/rate-limit";
import { handleRouteError } from "@/lib/api/route-helpers";
import { parseJsonBodyWithSchema } from "@/lib/api/validation";
import { requireCliActorFromBearer } from "@/lib/cli/auth";
import { cliPublishRequestSchema } from "@/lib/cli/schemas";
import { templatePath } from "@/lib/routes";
import {
  getPrivateTemplateStream,
  verifyBlobExistsAndMetadata,
} from "@/lib/templates/blob";
import { createCliTemplateDraft } from "@/lib/templates/service";
import {
  computePublisherHash,
  verifySignedTemplateArchive,
} from "@/lib/templates/signing";
import { getTemplateRecordBySlug } from "@/lib/templates/repository";

async function readPrivateZipBytes(pathname: string): Promise<Uint8Array> {
  const blobResult = await getPrivateTemplateStream(pathname);
  const response = new Response(blobResult.stream);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function POST(request: Request) {
  try {
    const actor = await requireCliActorFromBearer(request);
    const rateLimitedResponse = await enforceCliPublishRateLimit(request, actor.id);
    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    const input = await parseJsonBodyWithSchema(request, cliPublishRequestSchema);

    const existingTemplate = await getTemplateRecordBySlug(input.slug);
    if (existingTemplate) {
      return jsonError("Template slug is already in use.", {
        code: "SLUG_ALREADY_EXISTS",
        status: 409,
      });
    }

    const zipMetadata = await verifyBlobExistsAndMetadata({
      assetType: "zip",
      pathname: input.zipUpload.pathname,
      templateOwner: {
        sellerId: actor.id,
        slug: input.slug,
      },
      version: 1,
    });

    const zipBytes = await readPrivateZipBytes(zipMetadata.pathname);
    const publisherHash = computePublisherHash(actor.email);
    const verifiedArchive = verifySignedTemplateArchive({
      zipBytes,
      expected: {
        slug: input.slug,
        title: input.title,
        version: 1,
        publisherHash,
      },
    });

    const createdTemplate = await createCliTemplateDraft({
      actor: {
        id: actor.id,
        role: actor.role,
      },
      title: input.title,
      slug: input.slug,
      zipObjectKey: zipMetadata.pathname,
      fileSizeBytes: zipMetadata.size,
      publisherHash,
      archiveHash: verifiedArchive.archiveHash,
    });

    const baseUrl = getBaseUrlFromRequest(request);

    return jsonSuccess(
      {
        template: createdTemplate,
        templateUrl: `${baseUrl}${templatePath(createdTemplate.slug)}`,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(error, {
      message: "Unable to publish template via CLI flow.",
      code: "CLI_TEMPLATE_PUBLISH_ERROR",
      status: 400,
    });
  }
}
