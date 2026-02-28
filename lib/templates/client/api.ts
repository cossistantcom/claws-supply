type ApiSuccess<T> = {
  data: T;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

export type TemplateStatus = "draft" | "published" | "unpublished" | "deleted";

export type BlobUploadReferenceInput = {
  pathname: string;
  url?: string;
  contentType?: string;
  size?: number;
  etag?: string;
};

export type TemplateMutationDTO = {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  priceCents: number;
  currency: string;
  category: string;
  zipObjectKey: string | null;
  fileSizeBytes: number | null;
  coverImageUrl: string | null;
  version: number | null;
  versionNotes: string | null;
  publisherHash: string | null;
  archiveHash: string | null;
  status: TemplateStatus;
  publishedAt: string | null;
  unpublishedAt: string | null;
  deletedAt: string | null;
  isFlagged: boolean;
  flagReason: string | null;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TemplateVersionDTO = {
  id: string;
  templateId: string;
  version: number;
  zipObjectKey: string;
  fileSizeBytes: number;
  releaseNotes: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type TemplatePublishResult = {
  template: TemplateMutationDTO;
  version: TemplateVersionDTO;
};

type UnpublishTemplateResponse = {
  status: TemplateStatus;
  unpublishedAt: string | null;
};

type DeleteTemplateResponse = {
  success: boolean;
};

export type CreateTemplatePayload = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  priceCents: number;
  currency?: "USD";
};

export type UpdateTemplatePayload = {
  title?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  priceCents?: number;
  currency?: "USD";
  coverUpload?: BlobUploadReferenceInput;
  versionNotes?: string;
};

export type PublishTemplatePayload = {
  versionNotes?: string;
  coverUpload?: BlobUploadReferenceInput;
};

function resolveApiErrorMessage(
  payload: ApiSuccess<unknown> | ApiErrorPayload | null,
  fallback: string,
) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim().length > 0
  ) {
    return payload.error.message;
  }

  return fallback;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let payload: ApiSuccess<T> | ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiErrorPayload;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(resolveApiErrorMessage(payload, "Request failed."));
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Invalid API response.");
  }

  return payload.data as T;
}

export function createTemplateDraft(input: CreateTemplatePayload) {
  return requestJson<TemplateMutationDTO>("/api/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTemplate(slug: string, input: UpdateTemplatePayload) {
  return requestJson<TemplateMutationDTO>(`/api/templates/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function publishTemplate(
  slug: string,
  input: PublishTemplatePayload = {},
) {
  return requestJson<TemplatePublishResult>(
    `/api/templates/${encodeURIComponent(slug)}/publish`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function unpublishTemplate(slug: string) {
  return requestJson<UnpublishTemplateResponse>(
    `/api/templates/${encodeURIComponent(slug)}/unpublish`,
    {
      method: "POST",
    },
  );
}

export function deleteTemplate(slug: string) {
  return requestJson<DeleteTemplateResponse>(`/api/templates/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}
