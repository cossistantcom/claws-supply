import { get, head } from "@vercel/blob";
import { TemplateServiceError } from "./errors";
import {
  COVER_ALLOWED_CONTENT_TYPES,
  MAX_COVER_IMAGE_BYTES,
  MAX_TEMPLATE_ZIP_BYTES,
  TEMPLATE_ZIP_ALLOWED_CONTENT_TYPES,
  UPLOAD_TOKEN_TTL_MS,
} from "./policy";
import {
  buildCoverPathPrefix,
  buildTemplateZipPathname,
  containsInvalidPathTraversal,
  normalizeBlobPathname,
} from "./pathnames";

export type TemplateAssetType = "cover" | "zip";

export type BlobMetadata = {
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  etag: string;
};

function requireEnv(name: "BLOB_READ_WRITE_TOKEN" | "PRIVATE_READ_WRITE_TOKEN") {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new TemplateServiceError(`Missing required environment variable: ${name}.`, {
      code: "STORAGE_NOT_CONFIGURED",
      status: 500,
    });
  }

  return value;
}

export function getBlobTokenForAssetType(assetType: TemplateAssetType): string {
  if (assetType === "cover") {
    return requireEnv("BLOB_READ_WRITE_TOKEN");
  }

  return requireEnv("PRIVATE_READ_WRITE_TOKEN");
}

export function normalizeContentType(contentType: string): string {
  return contentType.trim().toLowerCase();
}

export function getUploadMaximumSize(assetType: TemplateAssetType): number {
  return assetType === "cover" ? MAX_COVER_IMAGE_BYTES : MAX_TEMPLATE_ZIP_BYTES;
}

export function getUploadAllowedContentTypes(
  assetType: TemplateAssetType,
): readonly string[] {
  return assetType === "cover"
    ? COVER_ALLOWED_CONTENT_TYPES
    : TEMPLATE_ZIP_ALLOWED_CONTENT_TYPES;
}

export function getUploadValidityTimestamp(): number {
  return Date.now() + UPLOAD_TOKEN_TTL_MS;
}

function assertContentTypeAllowed(assetType: TemplateAssetType, contentType: string) {
  const normalized = normalizeContentType(contentType);
  const allowed = getUploadAllowedContentTypes(assetType);

  if (!allowed.includes(normalized)) {
    throw new TemplateServiceError("Unsupported upload content type.", {
      code: "UPLOAD_CONTENT_TYPE_INVALID",
      status: 400,
    });
  }
}

function assertPathnameValid(pathname: string) {
  if (!pathname || pathname.trim().length === 0) {
    throw new TemplateServiceError("Upload pathname is required.", {
      code: "UPLOAD_PATH_INVALID",
      status: 400,
    });
  }

  if (containsInvalidPathTraversal(pathname)) {
    throw new TemplateServiceError("Upload pathname is invalid.", {
      code: "UPLOAD_PATH_INVALID",
      status: 400,
    });
  }
}

export function assertCoverPathname(
  pathname: string,
  templateOwner: {
    sellerId: string;
    slug: string;
  },
) {
  const normalizedPathname = normalizeBlobPathname(pathname);
  assertPathnameValid(normalizedPathname);

  const expectedPrefix = buildCoverPathPrefix(
    templateOwner.sellerId,
    templateOwner.slug,
  );

  if (!normalizedPathname.startsWith(expectedPrefix)) {
    throw new TemplateServiceError("Cover upload pathname is not allowed.", {
      code: "UPLOAD_PATH_INVALID",
      status: 400,
    });
  }
}

export function assertTemplateZipPathname(
  pathname: string,
  templateOwner: {
    sellerId: string;
    slug: string;
  },
  version: string,
) {
  const normalizedPathname = normalizeBlobPathname(pathname);
  assertPathnameValid(normalizedPathname);

  const expectedPathname = buildTemplateZipPathname(
    templateOwner.sellerId,
    templateOwner.slug,
    version,
  );

  if (normalizedPathname !== expectedPathname) {
    throw new TemplateServiceError("Template zip pathname is invalid.", {
      code: "UPLOAD_PATH_INVALID",
      status: 400,
    });
  }
}

function assertUploadSizeAllowed(assetType: TemplateAssetType, size: number) {
  const maxSize = getUploadMaximumSize(assetType);

  if (size > maxSize) {
    throw new TemplateServiceError(
      `Uploaded file exceeds maximum size of ${maxSize} bytes.`,
      {
        code: "UPLOAD_TOO_LARGE",
        status: 400,
      },
    );
  }
}

export async function verifyBlobExistsAndMetadata(options: {
  assetType: TemplateAssetType;
  pathname: string;
  templateOwner: {
    sellerId: string;
    slug: string;
  };
  version?: string;
}): Promise<BlobMetadata> {
  const pathname = normalizeBlobPathname(options.pathname);

  if (options.assetType === "cover") {
    assertCoverPathname(pathname, options.templateOwner);
  } else {
    if (!options.version) {
      throw new TemplateServiceError("Template version is required.", {
        code: "VERSION_INVALID",
        status: 400,
      });
    }

    assertTemplateZipPathname(pathname, options.templateOwner, options.version);
  }

  const token = getBlobTokenForAssetType(options.assetType);

  let metadata;
  try {
    metadata = await head(pathname, {
      token,
    });
  } catch {
    throw new TemplateServiceError("Uploaded file was not found in storage.", {
      code: "UPLOAD_NOT_FOUND",
      status: 404,
    });
  }

  assertContentTypeAllowed(options.assetType, metadata.contentType);
  assertUploadSizeAllowed(options.assetType, metadata.size);

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

export async function getPrivateTemplateStream(pathname: string) {
  const token = getBlobTokenForAssetType("zip");
  const normalizedPathname = normalizeBlobPathname(pathname);

  const blobResult = await get(normalizedPathname, {
    access: "private",
    token,
  });

  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    throw new TemplateServiceError("Template file not found.", {
      code: "TEMPLATE_FILE_NOT_FOUND",
      status: 404,
    });
  }

  return blobResult;
}
