export class TemplateServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    message: string,
    options?: {
      code?: string;
      status?: number;
    },
  ) {
    super(message);
    this.name = "TemplateServiceError";
    this.code = options?.code ?? "TEMPLATE_ERROR";
    this.status = options?.status ?? 400;
  }
}

export function toTemplateServiceError(error: unknown): TemplateServiceError {
  if (error instanceof TemplateServiceError) {
    return error;
  }

  return new TemplateServiceError("Unexpected template error.", {
    code: "TEMPLATE_ERROR",
    status: 500,
  });
}
