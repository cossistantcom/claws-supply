import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { TemplateServiceError } from "@/lib/templates/errors";
import { cliManifestSchema, type CliManifest } from "@/lib/cli/schemas";

export type VerifiedTemplateArchive = {
  archiveHash: string;
  manifest: CliManifest;
};

function normalizeZipPath(pathname: string): string {
  return pathname.replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function toUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function sha256Hex(input: Uint8Array | Buffer | string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

export function computePublisherHash(email: string): string {
  return sha256Hex(email.trim().toLowerCase());
}

export function verifySignedTemplateArchive(options: {
  zipBytes: Uint8Array;
  expected: {
    slug: string;
    title: string;
    version: number;
    publisherHash: string;
  };
}): VerifiedTemplateArchive {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(options.zipBytes);
  } catch {
    throw new TemplateServiceError("Template archive is not a valid zip file.", {
      code: "ARCHIVE_INVALID",
      status: 422,
    });
  }

  const normalizedEntries = new Map<string, Uint8Array>();
  for (const [rawPath, bytes] of Object.entries(entries)) {
    normalizedEntries.set(normalizeZipPath(rawPath), bytes);
  }

  const manifestEntry = normalizedEntries.get("manifest.json");
  if (!manifestEntry) {
    throw new TemplateServiceError("Template archive is missing manifest.json.", {
      code: "MANIFEST_MISSING",
      status: 422,
    });
  }

  let manifestRaw: unknown;
  try {
    manifestRaw = JSON.parse(toUtf8(manifestEntry));
  } catch {
    throw new TemplateServiceError("manifest.json must contain valid JSON.", {
      code: "MANIFEST_INVALID",
      status: 422,
    });
  }

  const parsedManifest = cliManifestSchema.safeParse(manifestRaw);
  if (!parsedManifest.success) {
    const issue = parsedManifest.error.issues[0];
    throw new TemplateServiceError(issue?.message ?? "manifest.json is invalid.", {
      code: "MANIFEST_INVALID",
      status: 422,
    });
  }

  const manifest = parsedManifest.data;
  if (manifest.id !== options.expected.slug) {
    throw new TemplateServiceError("Manifest slug does not match requested slug.", {
      code: "MANIFEST_SLUG_MISMATCH",
      status: 422,
    });
  }

  if (manifest.title !== options.expected.title) {
    throw new TemplateServiceError("Manifest title does not match requested title.", {
      code: "MANIFEST_TITLE_MISMATCH",
      status: 422,
    });
  }

  if (manifest.version !== options.expected.version) {
    throw new TemplateServiceError(
      "Manifest version does not match the expected template version.",
      {
        code: "MANIFEST_VERSION_MISMATCH",
        status: 422,
      },
    );
  }

  if (manifest.publisherHash !== options.expected.publisherHash) {
    throw new TemplateServiceError("Manifest publisher hash is invalid.", {
      code: "PUBLISHER_HASH_MISMATCH",
      status: 403,
    });
  }

  for (const [filePath, expectedHash] of Object.entries(manifest.fileHashes)) {
    const normalizedPath = normalizeZipPath(filePath);
    const fileBytes = normalizedEntries.get(normalizedPath);

    if (!fileBytes) {
      throw new TemplateServiceError(
        `Manifest references missing file: ${normalizedPath}.`,
        {
          code: "MANIFEST_FILE_MISSING",
          status: 422,
        },
      );
    }

    const actualFileHash = `sha256:${sha256Hex(fileBytes)}`;
    if (actualFileHash !== expectedHash) {
      throw new TemplateServiceError(
        `File hash mismatch for ${normalizedPath}.`,
        {
          code: "MANIFEST_FILE_HASH_MISMATCH",
          status: 422,
        },
      );
    }
  }

  return {
    archiveHash: sha256Hex(options.zipBytes),
    manifest,
  };
}
