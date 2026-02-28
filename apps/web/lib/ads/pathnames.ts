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
  return pathname.trim().replace(/^\/+/, "");
}

export function containsInvalidPathTraversal(pathname: string): boolean {
  return pathname.includes("..");
}

export function buildAdLogoPathPrefix(userId: string): string {
  return `ads/public/logos/${userId}/`;
}

export function buildAdLogoPathname(options: {
  userId: string;
  originalFilename: string;
}): string {
  const base = options.originalFilename.split(".")[0] ?? "logo";
  const sanitizedBase = sanitizePathSegment(base) || "logo";

  return `${buildAdLogoPathPrefix(options.userId)}${Date.now()}-${createRandomSegment()}-${sanitizedBase}.svg`;
}

