import { parseWithSchema } from "@/lib/api/validation";
import { TemplateServiceError } from "./errors";
import {
  uploadClientPayloadSchema,
  type UploadClientPayloadInput,
} from "./schemas";

export function parseUploadClientPayload(
  clientPayload: string | null,
): UploadClientPayloadInput {
  if (!clientPayload) {
    throw new TemplateServiceError("Missing upload client payload.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(clientPayload);
  } catch {
    throw new TemplateServiceError("Upload client payload must be valid JSON.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  return parseWithSchema(uploadClientPayloadSchema, parsedPayload);
}

export function assertUploadClientPayloadMatch(options: {
  payload: UploadClientPayloadInput;
  expectedKind: UploadClientPayloadInput["kind"];
  expectedSlug: string;
}) {
  if (options.payload.kind !== options.expectedKind) {
    throw new TemplateServiceError("Upload payload kind is invalid.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }

  if (options.payload.templateSlug !== options.expectedSlug) {
    throw new TemplateServiceError("Upload payload slug is invalid.", {
      code: "INVALID_REQUEST",
      status: 400,
    });
  }
}
