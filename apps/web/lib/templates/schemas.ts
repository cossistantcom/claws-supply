import { z } from "zod";
import { isCategorySlug } from "@/lib/categories";

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const versionSchema = z
  .number()
  .int("version must be an integer.")
  .min(1, "version must be at least 1.");

const versionNotesSchema = z
  .string()
  .trim()
  .min(3, "versionNotes must be at least 3 characters.")
  .max(2_000, "versionNotes must be 2,000 characters or less.");

export const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .max(120, "Slug must be 120 characters or less.")
    .regex(
      slugRegex,
      "Slug must be lowercase, URL-safe, and hyphenated.",
    ),
});

export const uploadAssetTypeSchema = z.enum(["zip", "cover"]);

export const blobUploadReferenceSchema = z.object({
  pathname: z
    .string()
    .trim()
    .min(1, "Upload pathname is required.")
    .max(800, "Upload pathname is too long."),
  url: z.string().url("Upload url must be a valid URL.").optional(),
  contentType: z.string().trim().min(1).max(120).optional(),
  size: z.number().int().positive().optional(),
  etag: z.string().trim().min(1).max(400).optional(),
});

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters.")
  .max(140, "Title must be 140 characters or less.");

const shortDescriptionSchema = z
  .string()
  .trim()
  .min(10, "Short description must be at least 10 characters.")
  .max(240, "Short description must be 240 characters or less.");

const descriptionSchema = z
  .string()
  .trim()
  .min(20, "Description must be at least 20 characters.")
  .max(20_000, "Description must be 20,000 characters or less.");

const categorySchema = z
  .string()
  .trim()
  .refine((value) => isCategorySlug(value), {
    message: "Invalid category.",
  });

const priceSchema = z
  .number()
  .int("priceCents must be an integer.")
  .min(0, "priceCents cannot be negative.");

const currencySchema = z
  .literal("USD")
  .optional()
  .or(z.undefined());

export const createTemplateSchema = z
  .object({
    title: titleSchema,
    slug: slugParamSchema.shape.slug,
    shortDescription: shortDescriptionSchema,
    description: descriptionSchema,
    category: categorySchema,
    priceCents: priceSchema.default(0),
    currency: currencySchema,
  })
  .strict();

export const updateTemplateSchema = z
  .object({
    title: titleSchema.optional(),
    shortDescription: shortDescriptionSchema.optional(),
    description: descriptionSchema.optional(),
    category: categorySchema.optional(),
    priceCents: priceSchema.optional(),
    currency: currencySchema,
    coverUpload: blobUploadReferenceSchema.optional(),
    versionNotes: versionNotesSchema.optional(),
  })
  .strict()
  .refine(
    (payload) =>
      payload.title !== undefined ||
      payload.shortDescription !== undefined ||
      payload.description !== undefined ||
      payload.category !== undefined ||
      payload.priceCents !== undefined ||
      payload.coverUpload !== undefined ||
      payload.versionNotes !== undefined,
    {
      message: "At least one mutable field is required.",
    },
  );

export const publishTemplateSchema = z
  .object({
    versionNotes: versionNotesSchema.optional(),
    coverUpload: blobUploadReferenceSchema.optional(),
  })
  .strict();

export const publishTemplateVersionSchema = z
  .object({
    version: versionSchema,
    zipUpload: blobUploadReferenceSchema,
    versionNotes: versionNotesSchema.optional(),
  })
  .strict();

const uploadClientPayloadBaseSchema = z
  .object({
    templateSlug: slugParamSchema.shape.slug,
  })
  .strict();

export const uploadClientPayloadSchema = z.discriminatedUnion("kind", [
  uploadClientPayloadBaseSchema.extend({
    kind: z.literal("cover"),
    version: z.undefined().optional(),
  }),
  uploadClientPayloadBaseSchema.extend({
    kind: z.literal("zip"),
    version: versionSchema,
  }),
]);

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

export const blobHandleUploadBodySchema = z.discriminatedUnion("type", [
  blobGenerateClientTokenEventSchema,
  blobUploadCompletedEventSchema,
]);

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type PublishTemplateInput = z.infer<typeof publishTemplateSchema>;
export type PublishTemplateVersionInput = z.infer<
  typeof publishTemplateVersionSchema
>;
export type BlobUploadReferenceInput = z.infer<typeof blobUploadReferenceSchema>;
export type UploadClientPayloadInput = z.infer<typeof uploadClientPayloadSchema>;
