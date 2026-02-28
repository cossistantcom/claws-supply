import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireSessionOrThrow } from "@/lib/api/route-helpers";
import { parseRawJsonBodyWithSchema, parseWithSchema } from "@/lib/api/validation";
import { AdsServiceError } from "./errors";
import {
  adsBlobHandleUploadBodySchema,
  adLogoUploadClientPayloadSchema,
  adLogoUploadTokenPayloadSchema,
} from "./schemas";
import { assertAdLogoPathname, getAdsBlobToken, getAdsUploadValidityTimestamp } from "./blob";
import { AD_LOGO_ALLOWED_CONTENT_TYPES, MAX_AD_LOGO_BYTES } from "./policy";

function parseClientPayload(clientPayload: string | null) {
  if (!clientPayload) {
    throw new AdsServiceError("Missing upload client payload.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(clientPayload);
  } catch {
    throw new AdsServiceError("Upload client payload must be valid JSON.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  return parseWithSchema(adLogoUploadClientPayloadSchema, parsed);
}

function parseTokenPayload(tokenPayload: string | null) {
  if (!tokenPayload) {
    throw new AdsServiceError("Missing upload token payload.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(tokenPayload);
  } catch {
    throw new AdsServiceError("Upload token payload must be valid JSON.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  return parseWithSchema(adLogoUploadTokenPayloadSchema, parsed);
}

export async function handleAdsLogoUploadRoute(request: Request) {
  const { raw } = await parseRawJsonBodyWithSchema(request, adsBlobHandleUploadBodySchema);
  const body = raw as HandleUploadBody;
  const token = getAdsBlobToken();

  const result = await handleUpload({
    request,
    body,
    token,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const session = await requireSessionOrThrow(request);
      parseClientPayload(clientPayload);
      assertAdLogoPathname(pathname, session.user.id);

      return {
        allowedContentTypes: [...AD_LOGO_ALLOWED_CONTENT_TYPES],
        maximumSizeInBytes: MAX_AD_LOGO_BYTES,
        validUntil: getAdsUploadValidityTimestamp(),
        addRandomSuffix: false,
        allowOverwrite: false,
        tokenPayload: JSON.stringify({
          kind: "ad-logo",
          userId: session.user.id,
        }),
      };
    },
    onUploadCompleted: async (payload) => {
      const tokenPayload = parseTokenPayload(payload.tokenPayload ?? null);
      assertAdLogoPathname(payload.blob.pathname, tokenPayload.userId);
    },
  });

  // Vercel client upload requires the raw handleUpload response shape.
  return NextResponse.json(result);
}

