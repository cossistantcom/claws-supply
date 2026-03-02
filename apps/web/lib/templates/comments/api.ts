import type { TemplateComment, TemplateCommentConnection } from "./types";

type ApiSuccess<T> = {
  data: T;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

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
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Request failed.";

    throw new Error(message);
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Invalid API response.");
  }

  return payload.data as T;
}

export function fetchTemplateComments(options: {
  templateSlug: string;
  parentId?: string;
  cursor?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (options.parentId) {
    query.set("parentId", options.parentId);
  }

  if (options.cursor) {
    query.set("cursor", options.cursor);
  }

  if (typeof options.limit === "number") {
    query.set("limit", String(options.limit));
  }

  const encodedSlug = encodeURIComponent(options.templateSlug);
  const queryString = query.toString();
  const url =
    queryString.length > 0
      ? `/api/templates/${encodedSlug}/comments?${queryString}`
      : `/api/templates/${encodedSlug}/comments`;

  return requestJson<TemplateCommentConnection>(url, {
    method: "GET",
  });
}

export function createTemplateComment(options: {
  templateSlug: string;
  body: string;
  parentId?: string;
}) {
  const encodedSlug = encodeURIComponent(options.templateSlug);

  return requestJson<TemplateComment>(`/api/templates/${encodedSlug}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: options.body,
      ...(options.parentId ? { parentId: options.parentId } : {}),
    }),
  });
}

export function deleteTemplateComment(options: {
  templateSlug: string;
  commentId: string;
}) {
  const encodedSlug = encodeURIComponent(options.templateSlug);
  const encodedCommentId = encodeURIComponent(options.commentId);

  return requestJson<TemplateComment>(
    `/api/templates/${encodedSlug}/comments/${encodedCommentId}`,
    {
      method: "DELETE",
    },
  );
}
