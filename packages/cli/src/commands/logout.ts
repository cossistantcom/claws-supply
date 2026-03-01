import { clearAuthState } from "../lib/auth-store";
import { createLogger, printHeader } from "../utils/logger";

export type LogoutCommandOptions = {
  json?: boolean;
};

export async function runLogoutCommand(options: LogoutCommandOptions): Promise<void> {
  const jsonMode = options.json ?? false;
  const logger = createLogger({ json: jsonMode });
  printHeader({ json: jsonMode, logger });

  const result = await clearAuthState();

  if (jsonMode) {
    logger.json({
      success: true,
      loggedOut: true,
      authStatePath: result.path,
      removed: result.removed,
    });
    return;
  }

  if (result.removed) {
    logger.success("Logged out. Local auth state removed.");
  } else {
    logger.success("Already logged out. No local auth state found.");
  }

  logger.line(`Auth state path: ${result.path}`);
}
