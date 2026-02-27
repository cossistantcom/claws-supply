import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { parseSlugParams, requireSessionOrThrow } from "@/lib/api/route-helpers";
import { parseRawJsonBodyWithSchema } from "@/lib/api/validation";
import {
  assertCoverPathname,
  assertTemplateZipPathname,
  getBlobTokenForAssetType,
  getUploadAllowedContentTypes,
  getUploadMaximumSize,
  getUploadValidityTimestamp,
  type TemplateAssetType,
} from "./blob";
import { TemplateServiceError } from "./errors";
import {
  blobHandleUploadBodySchema,
  type UploadClientPayloadInput,
} from "./schemas";
import {
  assertCanManageTemplate,
  assertTemplateNotDeleted,
  requireTemplateBySlug,
} from "./service";
import {
  assertUploadClientPayloadMatch,
  parseUploadClientPayload,
} from "./upload-handle";

type UploadRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

function requireZipVersionFromPayload(payload: UploadClientPayloadInput): string {
  if (payload.kind !== "zip") {
    throw new TemplateServiceError("Template version is required.", {
      code: "VERSION_INVALID",
      status: 400,
    });
  }

  return payload.version;
}

function assertPathnameForAsset(options: {
  assetType: TemplateAssetType;
  pathname: string;
  templateOwner: {
    sellerId: string;
    slug: string;
  };
  payload: UploadClientPayloadInput;
}) {
  if (options.assetType === "cover") {
    assertCoverPathname(options.pathname, options.templateOwner);
    return;
  }

  const version = requireZipVersionFromPayload(options.payload);
  assertTemplateZipPathname(options.pathname, options.templateOwner, version);
}

export async function handleTemplateUploadRoute(options: {
  request: Request;
  context: UploadRouteContext;
  assetType: TemplateAssetType;
}) {
  const slug = await parseSlugParams(options.context.params);
  const { raw } = await parseRawJsonBodyWithSchema(
    options.request,
    blobHandleUploadBodySchema,
  );
  const body = raw as HandleUploadBody;
  const token = getBlobTokenForAssetType(options.assetType);

  const result = await handleUpload({
    request: options.request,
    body,
    token,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const session = await requireSessionOrThrow(options.request);
      const templateRow = await requireTemplateBySlug(slug);

      assertCanManageTemplate(session.user, templateRow);
      assertTemplateNotDeleted(templateRow);

      const payload = parseUploadClientPayload(clientPayload);
      assertUploadClientPayloadMatch({
        payload,
        expectedKind: options.assetType,
        expectedSlug: slug,
      });

      assertPathnameForAsset({
        assetType: options.assetType,
        pathname,
        templateOwner: {
          sellerId: templateRow.sellerId,
          slug: templateRow.slug,
        },
        payload,
      });

      return {
        allowedContentTypes: [...getUploadAllowedContentTypes(options.assetType)],
        maximumSizeInBytes: getUploadMaximumSize(options.assetType),
        validUntil: getUploadValidityTimestamp(),
        addRandomSuffix: false,
        allowOverwrite: false,
        tokenPayload: JSON.stringify(payload),
      };
    },
    onUploadCompleted: async (payload) => {
      const uploadPayload = parseUploadClientPayload(payload.tokenPayload ?? null);
      assertUploadClientPayloadMatch({
        payload: uploadPayload,
        expectedKind: options.assetType,
        expectedSlug: slug,
      });

      const templateRow = await requireTemplateBySlug(slug);
      assertPathnameForAsset({
        assetType: options.assetType,
        pathname: payload.blob.pathname,
        templateOwner: {
          sellerId: templateRow.sellerId,
          slug: templateRow.slug,
        },
        payload: uploadPayload,
      });
    },
  });

  // Vercel client upload requires the raw handleUpload response shape.
  return NextResponse.json(result);
}
