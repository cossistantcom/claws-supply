import { z } from "zod";
import { slugParamSchema } from "@/lib/templates/schemas";

const hashRegex = /^[a-f0-9]{64}$/;

export const cliDeviceCodeRequestSchema = z
  .object({
    clientId: z.string().trim().min(1).max(200).default("claws-supply-cli"),
    scope: z.string().trim().max(200).optional(),
  })
  .strict();

export const cliDeviceTokenRequestSchema = z
  .object({
    clientId: z.string().trim().min(1).max(200).default("claws-supply-cli"),
    deviceCode: z.string().trim().min(10).max(500),
  })
  .strict();

export const cliDeviceDecisionSchema = z
  .object({
    userCode: z.string().trim().min(4).max(50),
  })
  .strict();

export const cliSlugAvailabilityQuerySchema = z.object({
  slug: slugParamSchema.shape.slug,
});

export const cliZipTokenRequestSchema = z
  .object({
    slug: slugParamSchema.shape.slug,
  })
  .strict();

export const cliPublishRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters.")
      .max(140, "Title must be 140 characters or less."),
    slug: slugParamSchema.shape.slug,
    zipUpload: z
      .object({
        pathname: z.string().trim().min(1).max(800),
      })
      .strict(),
  })
  .strict();

export const cliManifestSchema = z.object({
  id: z.string().trim().min(1).max(200),
  version: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  publisherHash: z.string().regex(hashRegex, "publisherHash must be sha256 hex."),
  publishedAt: z.string().datetime({ offset: true }),
  fileHashes: z.record(
    z.string().trim().min(1),
    z.string().regex(/^sha256:[a-f0-9]{64}$/, "Invalid sha256 file hash value."),
  ),
});

export type CliPublishRequest = z.infer<typeof cliPublishRequestSchema>;
export type CliManifest = z.infer<typeof cliManifestSchema>;
