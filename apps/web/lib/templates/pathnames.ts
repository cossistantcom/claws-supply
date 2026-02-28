function sanitizePathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createRandomSegment(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().split("-")[0] ?? "file";
  }

  return Math.random().toString(36).slice(2, 10);
}

export function normalizeBlobPathname(pathname: string): string {
  const normalized = pathname.trim().replace(/^\/+/, "");
  return normalized;
}

export function containsInvalidPathTraversal(pathname: string): boolean {
  return pathname.includes("..");
}

export function buildCoverPathPrefix(sellerId: string, templateSlug: string): string {
  return `templates/public/covers/${sellerId}/${templateSlug}/`;
}

export function buildCoverPathname(options: {
  sellerId: string;
  templateSlug: string;
  originalFilename: string;
}): string {
  const base = options.originalFilename.split(".")[0] ?? "cover";
  const extension = options.originalFilename.split(".").pop() ?? "bin";
  const sanitizedBase = sanitizePathSegment(base) || "cover";
  const sanitizedExtension = sanitizePathSegment(extension) || "bin";

  return `${buildCoverPathPrefix(options.sellerId, options.templateSlug)}${Date.now()}-${createRandomSegment()}-${sanitizedBase}.${sanitizedExtension}`;
}

export function buildTemplateZipPathname(
  sellerId: string,
  templateSlug: string,
  version: number,
): string {
  return `templates/private/zips/${sellerId}/${templateSlug}/v${version}.zip`;
}
