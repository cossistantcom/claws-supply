import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://claws.supply";
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

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
};

export function buildSeoMetadata({
  title,
  description,
  path,
  noindex = false,
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noindex
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
