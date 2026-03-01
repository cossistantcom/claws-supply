import path from "node:path";
import fs from "fs-extra";
import { put } from "@vercel/blob/client";
import { createZipUploadToken, finalizeTemplatePublish } from "../lib/api";
import { requireAuthState } from "../lib/auth-store";
import {
  loadBuildMetadataFromArtifactZipPath,
  loadLatestBuildArtifact,
  type BuildArtifactMetadata,
} from "../lib/artifact-store";
import { extractManifestFromZipBytes } from "../lib/archive";
import { createLogger, printHeader } from "../utils/logger";
import { createSpinner } from "../utils/spinner";
import { CliError, EXIT_CODES } from "../utils/errors";
import { resolveApiBase } from "../lib/api-base";
import { toTemplateEditUrl } from "../lib/template-url";

export type PublishCommandOptions = {
  dev?: boolean;
  artifact?: string;
  json?: boolean;
};

type PublishArtifactInput = {
  zipPath: string;
  zipBytes: Uint8Array;
  slug: string;
  title: string;
  metadata: BuildArtifactMetadata | null;
};

async function resolvePublishArtifact(options: {
  artifactPath?: string;
}): Promise<PublishArtifactInput> {
  if (!options.artifactPath) {
    const latest = await loadLatestBuildArtifact();
    const zipBuffer = await fs.readFile(latest.zipPath);
    return {
      zipPath: latest.zipPath,
      zipBytes: new Uint8Array(zipBuffer),
      slug: latest.slug,
      title: latest.title,
      metadata: latest,
    };
  }

  const zipPath = path.resolve(options.artifactPath);
  const exists = await fs.pathExists(zipPath);
  if (!exists) {
    throw new CliError(`Artifact file does not exist: ${zipPath}`, {
      exitCode: EXIT_CODES.FILESYSTEM,
    });
  }

  const zipBuffer = await fs.readFile(zipPath);
  const zipBytes = new Uint8Array(zipBuffer);
  const manifest = extractManifestFromZipBytes(zipBytes);
  const metadata = await loadBuildMetadataFromArtifactZipPath(zipPath);

  return {
    zipPath,
    zipBytes,
    slug: metadata?.slug ?? manifest.id,
    title: metadata?.title ?? manifest.title,
    metadata,
  };
}

export async function runPublishCommand(options: PublishCommandOptions): Promise<void> {
  const jsonMode = options.json ?? false;
  const logger = createLogger({ json: jsonMode });
  printHeader({ json: jsonMode, logger });

  const authState = await requireAuthState();
  const apiBase = resolveApiBase(options.dev ?? false);

  const artifact = await resolvePublishArtifact({
    artifactPath: options.artifact,
  });

  const tokenSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Requesting upload token...",
  });

  const uploadToken = await createZipUploadToken({
    baseUrl: apiBase,
    token: authState.accessToken,
    slug: artifact.slug,
  });
  tokenSpinner.succeed("Upload token created.");

  if (artifact.zipBytes.byteLength > uploadToken.maximumSizeInBytes) {
    throw new CliError(
      `Artifact exceeds upload size limit (${artifact.zipBytes.byteLength} > ${uploadToken.maximumSizeInBytes}).`,
      {
        exitCode: EXIT_CODES.INVALID_INPUT,
      },
    );
  }

  const uploadSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Uploading zip artifact...",
  });

  await put(uploadToken.pathname, artifact.zipBytes, {
    access: "private",
    token: uploadToken.token,
    contentType: "application/zip",
  });

  uploadSpinner.succeed("Artifact uploaded.");

  const finalizeSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Finalizing draft publish...",
  });

  const finalizeResult = await finalizeTemplatePublish({
    baseUrl: apiBase,
    token: authState.accessToken,
    title: artifact.title,
    slug: artifact.slug,
    pathname: uploadToken.pathname,
  });

  finalizeSpinner.succeed("Draft created.");

  if (jsonMode) {
    logger.json({
      success: true,
      slug: finalizeResult.template.slug,
      title: finalizeResult.template.title,
      status: finalizeResult.template.status,
      templateUrl: finalizeResult.templateUrl,
      zipPath: artifact.zipPath,
      uploadPathname: uploadToken.pathname,
    });
    return;
  }

  logger.success("Publish complete.");
  logger.line(`Template Edit URL: ${toTemplateEditUrl(finalizeResult.templateUrl)}`);
  logger.line(`Status: ${finalizeResult.template.status}`);
}
