import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://claws.supply";
const DEFAULT_OG_IMAGE_PATH = "/og-main.png";
const SITE_NAME = "Claws.supply";

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL;

  return normalizeSiteUrl(envUrl ?? DEFAULT_SITE_URL);
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

function normalizeSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function buildRobotsMetadata(noindex: boolean): Metadata["robots"] {
  return {
    index: !noindex,
    follow: true,
    googleBot: {
      index: !noindex,
      follow: true,
    },
  };
}

type DynamicOgInput = {
  title: string;
  description?: string;
};

export function buildDynamicOgImagePath(input: DynamicOgInput) {
  const search = new URLSearchParams();
  search.set("title", truncateText(input.title, 110));

  const normalizedDescription = input.description?.trim();
  if (normalizedDescription && normalizedDescription.length > 0) {
    search.set("description", truncateText(normalizedDescription, 180));
  }

  return `/api/og?${search.toString()}`;
}

export function hasAnySearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return Object.values(searchParams).some((value) => {
    const normalized = normalizeSearchParamValue(value);
    return normalized !== undefined;
  });
}

export function getDefaultOgImagePath() {
  return DEFAULT_OG_IMAGE_PATH;
}

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  imagePath?: string;
  dynamicOg?: DynamicOgInput | null;
  ogType?: "website" | "article" | "profile";
};

export function buildSeoMetadata({
  title,
  description,
  path,
  noindex = false,
  imagePath,
  dynamicOg,
  ogType = "website",
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const dynamicOgInput = dynamicOg === undefined
    ? { title, description }
    : dynamicOg;
  const resolvedImagePath = imagePath ??
    (dynamicOgInput
      ? buildDynamicOgImagePath(dynamicOgInput)
      : getDefaultOgImagePath());
  const resolvedOgImageUrl = absoluteUrl(resolvedImagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: buildRobotsMetadata(noindex),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: ogType,
      images: [
        {
          url: resolvedOgImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [resolvedOgImageUrl],
    },
  };
}

type NoindexMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function buildNoindexMetadata(input: NoindexMetadataInput): Metadata {
  return buildSeoMetadata({
    ...input,
    noindex: true,
    dynamicOg: null,
  });
}
