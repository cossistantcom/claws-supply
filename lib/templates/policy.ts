export const MAX_TEMPLATE_ZIP_BYTES = 100 * 1024 * 1024; // 100MB
export const MAX_COVER_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const UPLOAD_TOKEN_TTL_MS = 10 * 60 * 1000;

export const TEMPLATE_ZIP_ALLOWED_CONTENT_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const COVER_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
