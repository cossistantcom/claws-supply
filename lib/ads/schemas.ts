import { z } from "zod";

export const adPlacementSchema = z.enum(["sidebar", "results", "both"]);

const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Company name must be at least 2 characters.")
  .max(80, "Company name must be 80 characters or less.");

const websiteUrlSchema = z
  .string()
  .trim()
  .url("Website URL must be valid.")
  .max(500, "Website URL is too long.");

const shortDescriptionSchema = z
  .string()
  .trim()
  .min(20, "Short description must be at least 20 characters.")
  .max(180, "Short description must be 180 characters or less.");

const blobUploadReferenceSchema = z.object({
  pathname: z
    .string()
    .trim()
    .min(1, "Upload pathname is required.")
    .max(800, "Upload pathname is too long."),
  url: z.string().url("Upload URL must be valid.").optional(),
  contentType: z.string().trim().min(1).max(120).optional(),
  size: z.number().int().positive().optional(),
});

export const createAdCampaignSchema = z
  .object({
    placement: adPlacementSchema,
    companyName: companyNameSchema,
    websiteUrl: websiteUrlSchema,
    shortDescription: shortDescriptionSchema,
    logoUpload: blobUploadReferenceSchema,
  })
  .strict();

export const adLogoUploadClientPayloadSchema = z
  .object({
    kind: z.literal("ad-logo"),
  })
  .strict();

export const adLogoUploadTokenPayloadSchema = z
  .object({
    kind: z.literal("ad-logo"),
    userId: z.string().trim().min(1),
  })
  .strict();

export const blobGenerateClientTokenEventSchema = z.object({
  type: z.literal("blob.generate-client-token"),
  payload: z.object({
    pathname: z.string().trim().min(1).max(800),
    multipart: z.boolean(),
    clientPayload: z.string().nullable(),
  }),
});

export const blobUploadCompletedEventSchema = z.object({
  type: z.literal("blob.upload-completed"),
  payload: z.object({
    blob: z.object({
      url: z.string().url(),
      downloadUrl: z.string().url(),
      pathname: z.string().trim().min(1),
      contentType: z.string().trim().min(1),
      contentDisposition: z.string().trim().min(1),
      etag: z.string().trim().min(1),
    }),
    tokenPayload: z.string().nullable().optional(),
  }),
});

export const adsBlobHandleUploadBodySchema = z.discriminatedUnion("type", [
  blobGenerateClientTokenEventSchema,
  blobUploadCompletedEventSchema,
]);

export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;
export type AdPlacementInput = z.infer<typeof adPlacementSchema>;
