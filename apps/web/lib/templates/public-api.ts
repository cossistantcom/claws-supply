import type {
  PublicTemplateDetail,
  TemplateListQueryInput,
  TemplateListResult,
} from "./public-types";

type ApiSuccess<T> = {
  data: T;
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

function buildTemplateListQuery(params: TemplateListQueryInput) {
  const query = new URLSearchParams();

  if (params.category) {
    query.set("category", params.category);
  }

  query.set("sort", params.sort);
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  query.set("freeOnly", String(params.freeOnly));

  if (params.search) {
    query.set("search", params.search);
  }

  return query;
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let json: ApiSuccess<T> | ApiErrorPayload | null = null;

  try {
    json = (await response.json()) as ApiSuccess<T> | ApiErrorPayload;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message =
      json &&
      typeof json === "object" &&
      "error" in json &&
      json.error &&
      typeof json.error.message === "string"
        ? json.error.message
        : "Request failed.";

    throw new Error(message);
  }

  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Invalid API response.");
  }

  return json.data as T;
}

export function fetchTemplateList(params: TemplateListQueryInput) {
  const query = buildTemplateListQuery(params);
  const url = query.toString().length > 0 ? `/api/templates?${query}` : "/api/templates";

  return requestJson<TemplateListResult>(url);
}

export function fetchTemplateDetail(slug: string) {
  return requestJson<PublicTemplateDetail>(`/api/templates/${encodeURIComponent(slug)}`);
}
