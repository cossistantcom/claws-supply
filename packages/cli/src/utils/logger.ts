import kleur from "kleur";

export type Logger = {
  info: (message: string) => void;
  success: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  line: (message?: string) => void;
  json: (payload: unknown) => void;
};

const ui = {
  brand: (value: string) => kleur.magenta().bold(value),
  success: (value: string) => kleur.green(value),
  warn: (value: string) => kleur.yellow(value),
  error: (value: string) => kleur.red().bold(value),
  info: (value: string) => kleur.cyan(value),
  dim: (value: string) => kleur.dim(value),
};

export function createLogger(options: { json: boolean }): Logger {
  return {
    info(message) {
      if (!options.json) {
        console.log(ui.info(message));
      }
    },
    success(message) {
      if (!options.json) {
        console.log(ui.success(message));
      }
    },
    warn(message) {
      if (!options.json) {
        console.warn(ui.warn(message));
      }
    },
    error(message) {
      if (!options.json) {
        console.error(ui.error(message));
      }
    },
    line(message = "") {
      if (!options.json) {
        console.log(message);
      }
    },
    json(payload) {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    },
  };
}

export function printHeader(options: { json: boolean; logger: Logger }) {
  if (options.json) {
    return;
  }

  options.logger.line(ui.brand("claws.supply"));
  options.logger.line(ui.dim("Template Creator CLI"));
  options.logger.line();
}

export function formatErrorMessage(summary: string, hint?: string): string {
  if (!hint) {
    return `✗ ${summary}`;
  }

  return `✗ ${summary}\n  ${hint}`;
}
