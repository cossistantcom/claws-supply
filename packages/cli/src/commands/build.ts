import path from "node:path";
import fs from "fs-extra";
import prompts from "prompts";
import { checkSlugAvailability } from "../lib/api";
import { requireAuthState } from "../lib/auth-store";
import { createTemplateArchive } from "../lib/archive";
import {
  buildSelectionGroups,
  discoverCandidateFiles,
  getDefaultSelectedGroupIds,
  resolveSelectedFiles,
  type FileSelectionGroup,
} from "../lib/file-selection";
import { saveBuildArtifact } from "../lib/artifact-store";
import { CliError, EXIT_CODES } from "../utils/errors";
import { createLogger, printHeader } from "../utils/logger";
import { createSpinner } from "../utils/spinner";
import { resolveApiBase } from "../lib/api-base";

export type BuildCommandOptions = {
  dev?: boolean;
  source?: string;
  title?: string;
  slug?: string;
  include?: string[];
  exclude?: string[];
  yes?: boolean;
  json?: boolean;
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateSlug(slug: string): string {
  if (slug.length < 3 || slug.length > 120 || !SLUG_REGEX.test(slug)) {
    throw new CliError(
      "Invalid slug. Use 3-120 lowercase URL-safe characters (letters, numbers, hyphens).",
      {
        exitCode: EXIT_CODES.INVALID_INPUT,
      },
    );
  }

  return slug;
}

async function promptForMetadata(input: {
  sourceDir: string;
  existingTitle?: string;
  existingSlug?: string;
}): Promise<{
  title: string;
  slug: string;
}> {
  const defaultTitle = input.existingTitle ?? path.basename(input.sourceDir);
  const titleResponse = await prompts({
    type: "text",
    name: "title",
    message: "Template title",
    initial: defaultTitle,
    validate: (value: string) => (value.trim().length >= 3 ? true : "Title must be at least 3 characters."),
  });

  if (!titleResponse.title) {
    throw new CliError("Build canceled.", {
      exitCode: EXIT_CODES.SUCCESS,
    });
  }

  const title = titleResponse.title.trim();
  const defaultSlug = input.existingSlug ?? slugify(title);
  const slugResponse = await prompts({
    type: "text",
    name: "slug",
    message: "Template slug",
    initial: defaultSlug,
    validate: (value: string) => {
      const normalized = value.trim();
      if (normalized.length < 3 || normalized.length > 120 || !SLUG_REGEX.test(normalized)) {
        return "Slug must be lowercase, URL-safe, and 3-120 chars.";
      }
      return true;
    },
  });

  if (!slugResponse.slug) {
    throw new CliError("Build canceled.", {
      exitCode: EXIT_CODES.SUCCESS,
    });
  }

  return {
    title,
    slug: slugResponse.slug.trim(),
  };
}

async function promptForGroups(groups: FileSelectionGroup[]): Promise<string[]> {
  const response = await prompts({
    type: "multiselect",
    name: "groupIds",
    message: "Select which groups to include in this build",
    hint: "Space to toggle, Enter to confirm",
    instructions: false,
    choices: groups.map((group) => ({
      title: group.label,
      value: group.id,
      selected: group.defaultSelected,
    })),
  });

  if (!response.groupIds) {
    throw new CliError("Build canceled.", {
      exitCode: EXIT_CODES.SUCCESS,
    });
  }

  return response.groupIds as string[];
}

export async function runBuildCommand(options: BuildCommandOptions): Promise<void> {
  const jsonMode = options.json ?? false;
  const logger = createLogger({ json: jsonMode });
  printHeader({ json: jsonMode, logger });

  const authState = await requireAuthState();
  const apiBase = resolveApiBase(options.dev ?? false);

  const sourceDir = path.resolve(options.source ?? process.cwd());
  const sourceExists = await fs.pathExists(sourceDir);
  if (!sourceExists) {
    throw new CliError(`Source directory does not exist: ${sourceDir}`, {
      exitCode: EXIT_CODES.FILESYSTEM,
    });
  }

  const isInteractive = process.stdout.isTTY && !jsonMode && !(options.yes ?? false);

  let title = options.title?.trim();
  let slug = options.slug?.trim();

  if (!title || !slug) {
    if (isInteractive) {
      const prompted = await promptForMetadata({
        sourceDir,
        existingTitle: title,
        existingSlug: slug,
      });
      title = prompted.title;
      slug = prompted.slug;
    } else {
      throw new CliError(
        "Non-interactive build requires --title and --slug (or use interactive mode).",
        {
          exitCode: EXIT_CODES.NON_INTERACTIVE_REQUIRED,
        },
      );
    }
  }

  title = title.trim();
  slug = validateSlug(slugify(slug));

  const slugCheckSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Checking slug availability...",
  });
  const slugAvailability = await checkSlugAvailability({
    baseUrl: apiBase,
    token: authState.accessToken,
    slug,
  });

  if (!slugAvailability.available) {
    slugCheckSpinner.fail("Slug is not available.");
    throw new CliError(`Template slug is already in use: ${slug}`, {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }
  slugCheckSpinner.succeed("Slug is available.");

  const discoverSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Scanning source files...",
  });
  const candidateFiles = await discoverCandidateFiles(sourceDir);
  discoverSpinner.succeed(`Discovered ${candidateFiles.length} candidate files.`);

  if (candidateFiles.length === 0) {
    throw new CliError("No eligible files found to include in build.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  const groups = buildSelectionGroups(candidateFiles);
  let selectedGroupIds = getDefaultSelectedGroupIds(groups);

  if (isInteractive) {
    selectedGroupIds = await promptForGroups(groups);
  }

  const includePatterns = options.include ?? [];
  const excludePatterns = options.exclude ?? [];

  const selectedFiles = resolveSelectedFiles({
    files: candidateFiles,
    groups,
    selectedGroupIds,
    includePatterns,
    excludePatterns,
  });

  if (selectedFiles.length === 0) {
    throw new CliError("No files selected after include/exclude filters.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  const buildSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Building deterministic archive...",
  });

  const archive = await createTemplateArchive({
    sourceDir,
    files: selectedFiles,
    slug,
    title,
    publisherHash: authState.publisherHash,
  });

  const metadata = await saveBuildArtifact({
    sourceDir,
    slug,
    title,
    publisherHash: authState.publisherHash,
    archiveHash: archive.archiveHash,
    includePatterns,
    excludePatterns,
    manifest: archive.manifest,
    zipBytes: archive.zipBytes,
  });

  buildSpinner.succeed("Build artifact created.");

  if (jsonMode) {
    logger.json({
      success: true,
      slug: metadata.slug,
      title: metadata.title,
      fileCount: metadata.fileCount,
      archiveHash: metadata.archiveHash,
      zipPath: metadata.zipPath,
      manifestPath: metadata.manifestPath,
      metadataPath: metadata.metadataPath,
    });
    return;
  }

  logger.success("Build complete.");
  logger.line(`Slug: ${metadata.slug}`);
  logger.line(`Files: ${metadata.fileCount}`);
  logger.line(`Zip: ${metadata.zipPath}`);
  logger.line(`Manifest: ${metadata.manifestPath}`);
  logger.line(`Archive hash: ${metadata.archiveHash}`);
}
