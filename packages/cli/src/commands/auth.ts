import { resolveAuthStatePath, resolveAuthConfigDir } from "../lib/paths";
import { startDeviceAuthorization, pollDeviceAuthorizationToken } from "../lib/api";
import { DEFAULT_CLIENT_ID } from "../lib/constants";
import { saveAuthState } from "../lib/auth-store";
import { openBrowser } from "../lib/browser";
import { createLogger, printHeader } from "../utils/logger";
import { createSpinner } from "../utils/spinner";
import { sleep } from "../lib/sleep";
import { classifyAuthPollError } from "../lib/auth-polling";
import { CliError, EXIT_CODES } from "../utils/errors";
import { resolveApiBase } from "../lib/api-base";

export type AuthCommandOptions = {
  dev?: boolean;
  clientId?: string;
  open?: boolean;
  json?: boolean;
};

export async function runAuthCommand(options: AuthCommandOptions): Promise<void> {
  const jsonMode = options.json ?? false;
  const logger = createLogger({ json: jsonMode });
  const apiBase = resolveApiBase(options.dev ?? false);
  const clientId = options.clientId ?? DEFAULT_CLIENT_ID;
  const shouldOpen = options.open ?? true;

  printHeader({ json: jsonMode, logger });

  const startSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Starting device authorization...",
  });

  const deviceCodeResponse = await startDeviceAuthorization({
    baseUrl: apiBase,
    clientId,
  });
  startSpinner.succeed("Device authorization ready.");

  if (!jsonMode) {
    logger.line(`User code: ${deviceCodeResponse.user_code}`);
    logger.line(`Open this URL to approve: ${deviceCodeResponse.verification_uri_complete}`);
    logger.line();
  }

  if (shouldOpen) {
    const opened = await openBrowser(deviceCodeResponse.verification_uri_complete);
    if (!opened && !jsonMode) {
      logger.warn("Could not open browser automatically. Open the URL manually.");
    }
  }

  const deadline = Date.now() + deviceCodeResponse.expires_in * 1000;
  let delayMs = deviceCodeResponse.interval * 1000;
  let tokenResponse: Awaited<ReturnType<typeof pollDeviceAuthorizationToken>> | null = null;

  const pollSpinner = createSpinner({
    enabled: !jsonMode,
    text: "Waiting for approval...",
  });

  while (Date.now() < deadline) {
    await sleep(delayMs);

    try {
      tokenResponse = await pollDeviceAuthorizationToken({
        baseUrl: apiBase,
        clientId,
        deviceCode: deviceCodeResponse.device_code,
      });
      break;
    } catch (error) {
      const decision = classifyAuthPollError(error);

      if (decision.action === "continue") {
        continue;
      }

      if (decision.action === "slow_down") {
        const nextDelay = decision.delayMs ?? delayMs + 1000;
        delayMs = Math.max(nextDelay, delayMs + 500);
        continue;
      }

      pollSpinner.fail("Authorization failed.");
      throw new CliError(decision.reason, {
        exitCode: EXIT_CODES.NETWORK_OR_API,
      });
    }
  }

  if (!tokenResponse) {
    pollSpinner.fail("Authorization timed out.");
    throw new CliError("Device authorization timed out before approval.", {
      exitCode: EXIT_CODES.NETWORK_OR_API,
    });
  }

  await saveAuthState({
    version: 1,
    clientId,
    accessToken: tokenResponse.access_token,
    tokenType: tokenResponse.token_type,
    publisherHash: tokenResponse.publisherHash,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
  });

  pollSpinner.succeed("Authenticated.");

  if (jsonMode) {
    logger.json({
      success: true,
      apiBase,
      clientId,
      authStatePath: resolveAuthStatePath(),
      authConfigDir: resolveAuthConfigDir(),
      publisherHash: tokenResponse.publisherHash,
    });
    return;
  }

  logger.success("Authentication complete.");
  logger.line(`Saved auth state to: ${resolveAuthStatePath()}`);
}
