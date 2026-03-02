import path from "node:path";
import fs from "fs-extra";
import prompts from "prompts";
import {
  ApiHttpError,
  downloadTemplateArchive,
  fetchTemplateDetail,
} from "../lib/api";
import { resolveApiBase } from "../lib/api-base";
import { loadAuthState, requireAuthState, type AuthState } from "../lib/auth-store";
import { DEFAULT_CLIENT_ID } from "../lib/constants";
import {
  countDirectoryFiles,
  createWorkspaceStagingDir,
  extractWorkspaceInstallEntries,
  stageWorkspaceInstallEntries,
} from "../lib/workspace-install";
import { runAuthCommand } from "./auth";
import { CliError, EXIT_CODES } from "../utils/errors";
import { createLogger, printHeader } from "../utils/logger";
import { createSpinner } from "../utils/spinner";

export type UseCommandOptions = {
  dev?: boolean;
  yes?: boolean;
  open?: boolean;
  clientId?: string;
  json?: boolean;
};

function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);
}

function buildTemplatePageUrl(baseUrl: string, slug: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/openclaw/template/${encodeURIComponent(slug)}`;
  url.search = "";
  return url.toString();
}

function toFsErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unknown filesystem error.";
}

async function promptConfirm(message: string, initial: boolean): Promise<boolean> {
  const response = await prompts({
    type: "confirm",
    name: "confirmed",
    message,
    initial,
  });

  if (typeof response.confirmed !== "boolean") {
    throw new CliError("Use canceled.", {
      exitCode: EXIT_CODES.SUCCESS,
    });
  }

  return response.confirmed;
}

async function loadOptionalAuthState(): Promise<AuthState | null> {
  try {
    return await loadAuthState();
  } catch (error) {
    if (error instanceof CliError) {
      return null;
    }
    throw error;
  }
}

function createPaidTemplateRequiredError(input: {
  slug: string;
  baseUrl: string;
  priceCents: number;
  currency: string;
}) {
  const templatePageUrl = buildTemplatePageUrl(input.baseUrl, input.slug);
  return new CliError(
    `This is a paid template (${formatPrice(input.priceCents, input.currency)})\n  Purchase it at: ${templatePageUrl}`,
    {
      exitCode: EXIT_CODES.PAID_TEMPLATE_REQUIRED,
      status: 403,
    },
  );
}

export async function runUseCommand(
  templateSlug: string,
  options: UseCommandOptions,
): Promise<void> {
  const jsonMode = options.json ?? false;
  const logger = createLogger({ json: jsonMode });
  printHeader({ json: jsonMode, logger });

  const slug = templateSlug.trim();
  if (slug.length === 0) {
    throw new CliError("Template slug is required.", {
      exitCode: EXIT_CODES.INVALID_INPUT,
    });
  }

  const apiBase = resolveApiBase(options.dev ?? false);
  const assumeYes = options.yes ?? false;
  const canPrompt = process.stdout.isTTY && !jsonMode && !assumeYes;
  const requiresNonInteractiveConfirm = (!process.stdout.isTTY || jsonMode) && !assumeYes;

  if (requiresNonInteractiveConfirm) {
    throw new CliError("Non-interactive use requires --yes.", {
      exitCode: EXIT_CODES.NON_INTERACTIVE_REQUIRED,
    });
  }

  const metadataSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Fetching template metadata...",
  });

  let detail: Awaited<ReturnType<typeof fetchTemplateDetail>>;
  try {
    detail = await fetchTemplateDetail({
      baseUrl: apiBase,
      slug,
    });
  } catch (error) {
    metadataSpinner.fail("Failed to fetch template metadata.");

    if (error instanceof ApiHttpError && error.status === 404) {
      throw new CliError(`Template "${slug}" not found.`, {
        exitCode: EXIT_CODES.NETWORK_OR_API,
        status: 404,
      });
    }

    throw error;
  }

  metadataSpinner.succeed("Template metadata ready.");

  const template = detail.template;
  const isPaid = template.priceCents > 0;
  const clientId = options.clientId ?? DEFAULT_CLIENT_ID;

  let authState = await loadOptionalAuthState();

  if (isPaid && !authState) {
    if (!canPrompt) {
      throw new CliError("Authentication required. Run `claws-supply auth` first.", {
        exitCode: EXIT_CODES.INVALID_INPUT,
      });
    }

    logger.warn("This is a paid template. Authentication is required before download.");
    const shouldAuthenticate = await promptConfirm(
      "Authenticate now to continue?",
      true,
    );

    if (!shouldAuthenticate) {
      throw new CliError("Use canceled.", {
        exitCode: EXIT_CODES.SUCCESS,
      });
    }

    await runAuthCommand({
      dev: options.dev,
      clientId,
      open: options.open,
      json: false,
      suppressHeader: true,
    });

    authState = await requireAuthState();
  }

  const purchaseError = createPaidTemplateRequiredError({
    slug: template.slug,
    baseUrl: apiBase,
    priceCents: template.priceCents,
    currency: template.currency,
  });

  const downloadSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Downloading template archive...",
  });

  let downloadResult: Awaited<ReturnType<typeof downloadTemplateArchive>>;
  let attemptedReauth = false;

  while (true) {
    try {
      downloadResult = await downloadTemplateArchive({
        baseUrl: apiBase,
        slug: template.slug,
        token: authState?.accessToken,
      });
      break;
    } catch (error) {
      if (error instanceof ApiHttpError && isPaid && error.status === 403) {
        downloadSpinner.fail("Template access denied.");
        throw purchaseError;
      }

      if (error instanceof ApiHttpError && error.status === 404) {
        downloadSpinner.fail("Template not found.");
        throw new CliError(`Template "${template.slug}" not found.`, {
          exitCode: EXIT_CODES.NETWORK_OR_API,
          status: 404,
        });
      }

      if (error instanceof ApiHttpError && isPaid && error.status === 401) {
        if (canPrompt && !attemptedReauth) {
          downloadSpinner.stop();
          const shouldReauthenticate = await promptConfirm(
            "Session expired or missing. Re-authenticate now?",
            true,
          );

          if (!shouldReauthenticate) {
            throw new CliError("Use canceled.", {
              exitCode: EXIT_CODES.SUCCESS,
            });
          }

          await runAuthCommand({
            dev: options.dev,
            clientId,
            open: options.open,
            json: false,
            suppressHeader: true,
          });
          authState = await requireAuthState();
          attemptedReauth = true;
          continue;
        }

        throw new CliError("Authentication required. Run `claws-supply auth` first.", {
          exitCode: EXIT_CODES.INVALID_INPUT,
          status: 401,
        });
      }

      throw error;
    }
  }

  downloadSpinner.succeed("Template archive downloaded.");

  const entries = extractWorkspaceInstallEntries(downloadResult.zipBytes);
  const targetDirectory = path.resolve(process.cwd(), ".openclaw", "workspace");

  if (canPrompt) {
    logger.line(`Install destination: ${targetDirectory}`);
  }

  if (!assumeYes) {
    const shouldApply = await promptConfirm(
      `Apply "${template.title}" to this workspace folder?`,
      true,
    );

    if (!shouldApply) {
      throw new CliError("Use canceled.", {
        exitCode: EXIT_CODES.SUCCESS,
      });
    }
  }

  let targetExists = await fs.pathExists(targetDirectory);
  let existingFileCount = 0;
  if (targetExists) {
    const targetStat = await fs.stat(targetDirectory);
    if (!targetStat.isDirectory()) {
      throw new CliError(
        `Install target is not a directory: ${targetDirectory}`,
        {
          exitCode: EXIT_CODES.FILESYSTEM,
        },
      );
    }

    existingFileCount = await countDirectoryFiles(targetDirectory);
  }

  if (targetExists && existingFileCount > 0) {
    let shouldReplace = assumeYes;

    if (!assumeYes) {
      logger.warn("Workspace already contains files.");
      logger.line(`Current files: ${existingFileCount}`);
      logger.line(`Incoming files: ${entries.length}`);

      shouldReplace = await promptConfirm(
        "Replace existing workspace files with the new template files?",
        false,
      );
    }

    if (!shouldReplace) {
      throw new CliError("Use canceled.", {
        exitCode: EXIT_CODES.SUCCESS,
      });
    }
  }

  const applySpinner = createSpinner({
    enabled: !jsonMode,
    text: "Applying template to workspace...",
  });

  let stageDirectory: string | null = null;
  let backupDirectory: string | null = null;

  try {
    stageDirectory = await createWorkspaceStagingDir(targetDirectory);
    await stageWorkspaceInstallEntries({
      stageDirectory,
      entries,
    });

    if (targetExists && existingFileCount > 0) {
      backupDirectory = path.join(
        path.dirname(targetDirectory),
        `.workspace-backup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      );

      await fs.move(targetDirectory, backupDirectory, { overwrite: false });

      try {
        await fs.move(stageDirectory, targetDirectory, { overwrite: false });
        stageDirectory = null;
      } catch (error) {
        if (await fs.pathExists(targetDirectory)) {
          await fs.remove(targetDirectory);
        }

        if (await fs.pathExists(backupDirectory)) {
          await fs.move(backupDirectory, targetDirectory, { overwrite: true });
        }

        throw error;
      }

      await fs.remove(backupDirectory);
      backupDirectory = null;
    } else {
      if (targetExists) {
        await fs.remove(targetDirectory);
      }

      await fs.move(stageDirectory, targetDirectory, { overwrite: false });
      stageDirectory = null;
    }
  } catch (error) {
    applySpinner.fail("Failed to apply template.");

    if (error instanceof CliError) {
      throw error;
    }

    throw new CliError(
      `Failed to apply template files: ${toFsErrorMessage(error)}`,
      {
        exitCode: EXIT_CODES.FILESYSTEM,
      },
    );
  } finally {
    if (stageDirectory && (await fs.pathExists(stageDirectory))) {
      await fs.remove(stageDirectory);
    }

    if (backupDirectory && (await fs.pathExists(backupDirectory))) {
      await fs.remove(backupDirectory);
    }
  }

  applySpinner.succeed("Template applied to workspace.");

  if (jsonMode) {
    logger.json({
      success: true,
      slug: template.slug,
      title: template.title,
      version: template.version,
      directory: targetDirectory,
      fileCount: entries.length,
    });
    return;
  }

  logger.success("Template applied.");
  logger.line(`Directory: ${targetDirectory}`);
  logger.line(`Files: ${entries.length}`);
}
