export const EXIT_CODES = {
  SUCCESS: 0,
  INVALID_INPUT: 1,
  INTEGRITY_FAILURE: 2,
  PAID_TEMPLATE_REQUIRED: 3,
  NON_INTERACTIVE_REQUIRED: 4,
  NETWORK_OR_API: 5,
  FILESYSTEM: 7,
  UNKNOWN: 99,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

export class CliError extends Error {
  readonly exitCode: ExitCode;
  readonly code?: string;
  readonly status?: number;

  constructor(
    message: string,
    options?: {
      exitCode?: ExitCode;
      code?: string;
      status?: number;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "CliError";
    this.exitCode = options?.exitCode ?? EXIT_CODES.UNKNOWN;
    this.code = options?.code;
    this.status = options?.status;
  }
}

export function normalizeError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError(error.message, {
      exitCode: EXIT_CODES.UNKNOWN,
      cause: error,
    });
  }

  return new CliError("Unknown error", {
    exitCode: EXIT_CODES.UNKNOWN,
  });
}
