import { runCli } from "./cli";
import { normalizeError } from "./utils/errors";
import { createLogger, formatErrorMessage } from "./utils/logger";

runCli().catch((error) => {
  const normalized = normalizeError(error);
  const logger = createLogger({ json: false });
  logger.error(formatErrorMessage(normalized.message));
  process.exit(normalized.exitCode);
});
