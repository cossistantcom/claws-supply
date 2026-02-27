import { ZodError, type ZodType } from "zod";

const DEFAULT_INVALID_REQUEST_MESSAGE = "Invalid request payload.";

export class ApiValidationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "ApiValidationError";
    this.code = options?.code ?? "INVALID_REQUEST";
    this.status = options?.status ?? 400;
  }
}

export function getFirstZodErrorMessage(error: ZodError): string {
  const issue = error.issues[0];

  if (!issue) {
    return DEFAULT_INVALID_REQUEST_MESSAGE;
  }

  if (!issue.path || issue.path.length === 0) {
    return issue.message;
  }

  return `${issue.path.join(".")}: ${issue.message}`;
}

export function parseWithSchema<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ApiValidationError(getFirstZodErrorMessage(result.error));
  }

  return result.data;
}

export async function parseJsonBodyWithSchema<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  const { data } = await parseRawJsonBodyWithSchema(request, schema);
  return data;
}

export async function parseRawJsonBodyWithSchema<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{
  raw: unknown;
  data: T;
}> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiValidationError("Invalid JSON payload.");
  }

  return {
    raw: payload,
    data: parseWithSchema(schema, payload),
  };
}
