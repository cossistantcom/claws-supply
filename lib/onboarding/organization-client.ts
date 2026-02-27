"use client";

import { authClient } from "@/lib/auth-client";
import { extractErrorMessage } from "@/lib/onboarding/error-messages";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function organizationNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "Hourglass Organization";
  }
  return localPart;
}

export async function ensureActiveOrganization(email: string): Promise<string> {
  const currentOrg = await authClient.organization.getFullOrganization();
  if (currentOrg.error) {
    throw new Error(
      extractErrorMessage(currentOrg.error, "Unable to load organization."),
    );
  }

  if (currentOrg.data?.id) {
    return currentOrg.data.id;
  }

  const organizationName = organizationNameFromEmail(email);
  const baseSlug = slugify(organizationName) || "founder";
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = `${baseSlug}-${randomSuffix()}`;
    const created = await authClient.organization.create({
      name: organizationName,
      slug,
    });

    if (created.error) {
      lastError = extractErrorMessage(
        created.error,
        "Unable to create organization.",
      );
      continue;
    }

    const organizationId = created.data?.id;
    if (!organizationId) {
      lastError = "Organization creation returned no id.";
      continue;
    }

    const activated = await authClient.organization.setActive({
      organizationId,
    });

    if (activated.error) {
      throw new Error(
        extractErrorMessage(activated.error, "Unable to activate organization."),
      );
    }

    return organizationId;
  }

  throw new Error(lastError ?? "Unable to create organization.");
}
