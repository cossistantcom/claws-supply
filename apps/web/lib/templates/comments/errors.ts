export class TemplateCommentServiceError extends Error {
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
    this.name = "TemplateCommentServiceError";
    this.code = options?.code ?? "TEMPLATE_COMMENT_ERROR";
    this.status = options?.status ?? 400;
  }
}
