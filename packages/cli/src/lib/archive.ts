import fs from "fs-extra";
import path from "node:path";
import { unzipSync, zipSync } from "fflate";
import { BUILD_VERSION } from "./constants";
import { sha256Hex, sha256Label } from "./hash";
import { ManifestSchema, type Manifest } from "../schemas/manifest";
import { CliError, EXIT_CODES } from "../utils/errors";

function normalizePath(value: string): string {
  return value.split(path.sep).join("/").replace(/^\/+/, "");
}

export async function createTemplateArchive(options: {
  sourceDir: string;
  files: string[];
  slug: string;
  title: string;
  publisherHash: string;
}): Promise<{
  manifest: Manifest;
  zipBytes: Uint8Array;
  archiveHash: string;
}> {
  const zipMtime = new Date("1980-01-01T00:00:00.000Z");
  const encoder = new TextEncoder();
  const zippedEntries: Record<string, Uint8Array | [Uint8Array, { mtime: Date; level: number }]> = {};
  const fileHashes: Record<string, string> = {};

  const sortedFiles = [...options.files].sort((a, b) => a.localeCompare(b));

  for (const relativePath of sortedFiles) {
    const normalized = normalizePath(relativePath);
    const absolutePath = path.join(options.sourceDir, relativePath);
    const buffer = await fs.readFile(absolutePath);
    const bytes = new Uint8Array(buffer);

    fileHashes[normalized] = sha256Label(bytes);
    zippedEntries[normalized] = [bytes, { mtime: zipMtime, level: 9 }];
  }

  const manifest: Manifest = {
    id: options.slug,
    version: BUILD_VERSION,
    title: options.title,
    publisherHash: options.publisherHash,
    publishedAt: new Date().toISOString(),
    fileHashes,
  };

  const manifestParsed = ManifestSchema.safeParse(manifest);
  if (!manifestParsed.success) {
    throw new CliError(`Generated manifest is invalid: ${manifestParsed.error.issues[0]?.message ?? "unknown"}`, {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  zippedEntries["manifest.json"] = [encoder.encode(manifestText), { mtime: zipMtime, level: 9 }];

  const zipBytes = zipSync(zippedEntries, { level: 9 });
  const archiveHash = sha256Hex(zipBytes);

  return {
    manifest,
    zipBytes,
    archiveHash,
  };
}

export function extractManifestFromZipBytes(zipBytes: Uint8Array): Manifest {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes);
  } catch {
    throw new CliError("Artifact zip is invalid.", {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  const manifestEntry = entries["manifest.json"];
  if (!manifestEntry) {
    throw new CliError("Artifact zip is missing manifest.json.", {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(manifestEntry));
  } catch {
    throw new CliError("manifest.json is invalid JSON.", {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  const parsedManifest = ManifestSchema.safeParse(parsedJson);
  if (!parsedManifest.success) {
    throw new CliError("manifest.json shape is invalid.", {
      exitCode: EXIT_CODES.INTEGRITY_FAILURE,
    });
  }

  return parsedManifest.data;
}

export async function extractManifestFromZipPath(zipPath: string): Promise<Manifest> {
  const bytes = await fs.readFile(zipPath);
  return extractManifestFromZipBytes(new Uint8Array(bytes));
}
