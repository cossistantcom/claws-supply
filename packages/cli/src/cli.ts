import { Command } from "commander";
import { runAuthCommand, type AuthCommandOptions } from "./commands/auth";
import { runBuildCommand, type BuildCommandOptions } from "./commands/build";
import { runLogoutCommand, type LogoutCommandOptions } from "./commands/logout";
import { runPublishCommand, type PublishCommandOptions } from "./commands/publish";
import { DEFAULT_CLIENT_ID } from "./lib/constants";
import { EXIT_CODES, normalizeError } from "./utils/errors";
import { createLogger, formatErrorMessage } from "./utils/logger";

function collectString(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function toHint(error: ReturnType<typeof normalizeError>): string | undefined {
  if (error.status === 401) {
    return "Run `claws-supply auth` again and ensure your session is still valid.";
  }

  if (error.status === 409) {
    return "Pick a different slug and run `claws-supply build` again.";
  }

  if (error.status === 422) {
    return "Rebuild the artifact and verify manifest/title/slug integrity.";
  }

  if (error.status === 429) {
    return "Rate limit reached. Wait briefly and retry.";
  }

  return undefined;
}

function wrapCommand<T extends { json?: boolean }>(handler: (options: T) => Promise<void>) {
  return async (options: T) => {
    try {
      await handler(options);
    } catch (error) {
      const normalized = normalizeError(error);
      const logger = createLogger({ json: options.json ?? false });
      const hint = toHint(normalized);

      if (normalized.exitCode === EXIT_CODES.SUCCESS) {
        if (options.json) {
          logger.json({
            success: false,
            canceled: true,
            message: normalized.message,
            exitCode: normalized.exitCode,
          });
        } else {
          logger.warn(normalized.message);
        }
        process.exitCode = normalized.exitCode;
        return;
      }

      if (options.json) {
        logger.json({
          success: false,
          error: {
            message: normalized.message,
            code: normalized.code,
            status: normalized.status,
            exitCode: normalized.exitCode,
            hint,
          },
        });
      } else {
        logger.error(formatErrorMessage(normalized.message, hint));
      }

      process.exitCode = normalized.exitCode;
    }
  };
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("claws-supply")
    .description("claws.supply template creator CLI")
    .showHelpAfterError(true);

  program
    .command("auth")
    .description("Authenticate via Better Auth device authorization")
    .option("-D, --dev", "Use local API at http://localhost:3039")
    .option("--client-id <id>", "Device auth client ID", DEFAULT_CLIENT_ID)
    .option("--no-open", "Do not auto-open browser")
    .option("--json", "Emit machine-readable JSON output")
    .action(wrapCommand<AuthCommandOptions>(runAuthCommand));

  program
    .command("logout")
    .description("Clear local CLI auth state")
    .option("--json", "Emit machine-readable JSON output")
    .action(wrapCommand<LogoutCommandOptions>(runLogoutCommand));

  program
    .command("build")
    .description("Build and sign a local template artifact")
    .option("-D, --dev", "Use local API at http://localhost:3039")
    .option("--source <path>", "Source directory", process.cwd())
    .option("--title <title>", "Template title")
    .option("--slug <slug>", "Template slug")
    .option("--include <glob>", "Additional include pattern", collectString, [])
    .option("--exclude <glob>", "Additional exclude pattern", collectString, [])
    .option("--yes", "Use defaults and skip interactive prompts")
    .option("--json", "Emit machine-readable JSON output")
    .action(wrapCommand<BuildCommandOptions>(runBuildCommand));

  program
    .command("publish")
    .description("Upload and publish the latest build artifact as draft")
    .option("-D, --dev", "Use local API at http://localhost:3039")
    .option("--artifact <path>", "Path to a built zip artifact")
    .option("--json", "Emit machine-readable JSON output")
    .action(wrapCommand<PublishCommandOptions>(runPublishCommand));

  return program;
}

export async function runCli(argv = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}
