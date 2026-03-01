import fs from "fs-extra";
import path from "node:path";
import { z } from "zod";
import { type Manifest } from "../schemas/manifest";
import { BUILD_VERSION } from "./constants";
import {
  resolveBuildVersionDir,
  resolveLatestBuildPointerPath,
  resolveProjectStateDir,
} from "./paths";
import { CliError, EXIT_CODES } from "../utils/errors";

export const BuildArtifactMetadataSchema = z.object({
  version: z.literal(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  sourceDir: z.string().min(1),
  zipPath: z.string().min(1),
  manifestPath: z.string().min(1),
  metadataPath: z.string().min(1),
  archiveHash: z.string().regex(/^[a-f0-9]{64}$/),
  publisherHash: z.string().regex(/^[a-f0-9]{64}$/),
  fileCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  includePatterns: z.array(z.string()),
  excludePatterns: z.array(z.string()),
});

export type BuildArtifactMetadata = z.infer<typeof BuildArtifactMetadataSchema>;

const LatestBuildPointerSchema = z.object({
  metadataPath: z.string().min(1),
});

export async function saveBuildArtifact(options: {
  cwd?: string;
  sourceDir: string;
  slug: string;
  title: string;
  publisherHash: string;
  archiveHash: string;
  includePatterns: string[];
  excludePatterns: string[];
  manifest: Manifest;
  zipBytes: Uint8Array;
}): Promise<BuildArtifactMetadata> {
  const buildDir = resolveBuildVersionDir({
    cwd: options.cwd,
    slug: options.slug,
    version: BUILD_VERSION,
  });

  await fs.ensureDir(buildDir);

  const zipPath = path.join(buildDir, "template-v1.zip");
  const manifestPath = path.join(buildDir, "manifest.json");
  const metadataPath = path.join(buildDir, "artifact.json");

  await fs.writeFile(zipPath, options.zipBytes);
  await fs.writeJson(manifestPath, options.manifest, { spaces: 2 });

  const metadata: BuildArtifactMetadata = {
    version: BUILD_VERSION,
    slug: options.slug,
    title: options.title,
    sourceDir: options.sourceDir,
    zipPath,
    manifestPath,
    metadataPath,
    archiveHash: options.archiveHash,
    publisherHash: options.publisherHash,
    fileCount: Object.keys(options.manifest.fileHashes).length,
    createdAt: new Date().toISOString(),
    includePatterns: options.includePatterns,
    excludePatterns: options.excludePatterns,
  };

  await fs.writeJson(metadataPath, metadata, { spaces: 2 });

  const latestPointerPath = resolveLatestBuildPointerPath(options.cwd);
  await fs.ensureDir(resolveProjectStateDir(options.cwd));
  await fs.writeJson(latestPointerPath, { metadataPath }, { spaces: 2 });

  return metadata;
}

export async function loadBuildArtifactMetadata(metadataPath: string): Promise<BuildArtifactMetadata> {
  const raw = await fs.readJson(metadataPath);
  const parsed = BuildArtifactMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    throw new CliError(`Build metadata file is invalid: ${metadataPath}`, {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  return parsed.data;
}

export async function loadLatestBuildArtifact(cwd = process.cwd()): Promise<BuildArtifactMetadata> {
  const latestPointerPath = resolveLatestBuildPointerPath(cwd);
  const exists = await fs.pathExists(latestPointerPath);
  if (!exists) {
    throw new CliError("No build artifact found. Run `claws-supply build` first.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  const pointerRaw = await fs.readJson(latestPointerPath);
  const pointerParsed = LatestBuildPointerSchema.safeParse(pointerRaw);
  if (!pointerParsed.success) {
    throw new CliError("Latest build pointer is invalid. Re-run `claws-supply build`.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  return loadBuildArtifactMetadata(pointerParsed.data.metadataPath);
}

export async function loadBuildMetadataFromArtifactZipPath(zipPath: string): Promise<BuildArtifactMetadata | null> {
  const metadataPath = path.join(path.dirname(zipPath), "artifact.json");
  const exists = await fs.pathExists(metadataPath);
  if (!exists) {
    return null;
  }

  return loadBuildArtifactMetadata(metadataPath);
}
