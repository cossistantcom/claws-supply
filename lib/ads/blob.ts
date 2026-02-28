import { head } from "@vercel/blob";
import { AdsServiceError } from "./errors";
import { AD_LOGO_ALLOWED_CONTENT_TYPES, AD_UPLOAD_TOKEN_TTL_MS, MAX_AD_LOGO_BYTES } from "./policy";
import {
  buildAdLogoPathPrefix,
  containsInvalidPathTraversal,
  normalizeBlobPathname,
} from "./pathnames";

export type AdLogoBlobMetadata = {
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  etag: string;
};

function requirePublicBlobToken() {
  const value = process.env.BLOB_READ_WRITE_TOKEN;

  if (!value || value.trim().length === 0) {
    throw new AdsServiceError(
      "Missing required environment variable: BLOB_READ_WRITE_TOKEN.",
      {
        code: "STORAGE_NOT_CONFIGURED",
        status: 500,
      },
    );
  }

  return value;
}

function normalizeContentType(contentType: string) {
  return contentType.trim().toLowerCase();
}

function assertPathnameValid(pathname: string) {
  if (!pathname || pathname.trim().length === 0 || containsInvalidPathTraversal(pathname)) {
    throw new AdsServiceError("Upload pathname is invalid.", {
      code: "UPLOAD_PATH_INVALID",
      status: 400,
    });
  }
}

export function getAdsBlobToken() {
  return requirePublicBlobToken();
}

export function getAdsUploadValidityTimestamp() {
  return Date.now() + AD_UPLOAD_TOKEN_TTL_MS;
}

export function assertAdLogoPathname(pathname: string, userId: string) {
  const normalizedPathname = normalizeBlobPathname(pathname);
  assertPathnameValid(normalizedPathname);

  const expectedPrefix = buildAdLogoPathPrefix(userId);

  if (!normalizedPathname.startsWith(expectedPrefix)) {
    throw new AdsServiceError("Logo upload pathname is not allowed.", {
      code: "UPLOAD_PATH_INVALID",
      status: 400,
    });
  }
}

function assertAdLogoContentType(contentType: string) {
  if (
    !(AD_LOGO_ALLOWED_CONTENT_TYPES as readonly string[]).includes(
      normalizeContentType(contentType),
    )
  ) {
    throw new AdsServiceError("Unsupported logo content type.", {
      code: "UPLOAD_CONTENT_TYPE_INVALID",
      status: 400,
    });
  }
}

function assertAdLogoSize(size: number) {
  if (size > MAX_AD_LOGO_BYTES) {
    throw new AdsServiceError(
      `Uploaded logo exceeds maximum size of ${MAX_AD_LOGO_BYTES} bytes.`,
      {
        code: "UPLOAD_TOO_LARGE",
        status: 400,
      },
    );
  }
}

export async function verifyAdLogoExistsAndMetadata(options: {
  pathname: string;
  userId: string;
}): Promise<AdLogoBlobMetadata> {
  const pathname = normalizeBlobPathname(options.pathname);
  assertAdLogoPathname(pathname, options.userId);

  let metadata;
  try {
    metadata = await head(pathname, {
      token: requirePublicBlobToken(),
    });
  } catch {
    throw new AdsServiceError("Uploaded logo was not found in storage.", {
      code: "UPLOAD_NOT_FOUND",
      status: 404,
    });
  }

  assertAdLogoContentType(metadata.contentType);
  assertAdLogoSize(metadata.size);

  return {
    pathname: metadata.pathname,
    url: metadata.url,
    downloadUrl: metadata.downloadUrl,
    contentType: metadata.contentType,
    size: metadata.size,
    uploadedAt: metadata.uploadedAt,
    etag: metadata.etag,
  };
}
