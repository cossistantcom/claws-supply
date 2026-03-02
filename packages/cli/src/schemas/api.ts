import { z } from "zod";

export const ApiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const ApiSuccessEnvelopeSchema = z.object({
  data: z.unknown(),
});

export const DeviceCodeResponseSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.string().url(),
  verification_uri_complete: z.string().url(),
  interval: z.number().int().positive(),
  expires_in: z.number().int().positive(),
});

export const DeviceTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
  publisherHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const SlugAvailabilityResponseSchema = z.object({
  slug: z.string().min(1),
  available: z.boolean(),
});

export const ZipUploadTokenResponseSchema = z.object({
  token: z.string().min(1),
  pathname: z.string().min(1),
  allowedContentTypes: z.array(z.string().min(1)),
  maximumSizeInBytes: z.number().int().positive(),
});

export const PublishFinalizeResponseSchema = z.object({
  template: z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    status: z.string().min(1),
    version: z.number().int().nullable().optional(),
  }).passthrough(),
  templateUrl: z.string().url(),
});

const TemplateDetailSellerSchema = z
  .object({
    username: z.string().min(1),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    isVerified: z.boolean(),
  })
  .passthrough();

const TemplateDetailStatsSchema = z
  .object({
    downloadCount: z.number().int().nonnegative(),
    rating: z.number(),
    reviewCount: z.number().int().nonnegative(),
  })
  .passthrough();

const TemplateDetailTemplateSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    priceCents: z.number().int().nonnegative(),
    currency: z.string().min(1),
    version: z.number().int().nullable(),
    versionNotes: z.string().nullable(),
  })
  .passthrough();

export const TemplateDetailResponseSchema = z.object({
  template: TemplateDetailTemplateSchema,
  seller: TemplateDetailSellerSchema,
  stats: TemplateDetailStatsSchema,
  relatedTemplates: z.array(z.unknown()),
});

export type DeviceCodeResponse = z.infer<typeof DeviceCodeResponseSchema>;
export type DeviceTokenResponse = z.infer<typeof DeviceTokenResponseSchema>;
export type SlugAvailabilityResponse = z.infer<typeof SlugAvailabilityResponseSchema>;
export type ZipUploadTokenResponse = z.infer<typeof ZipUploadTokenResponseSchema>;
export type PublishFinalizeResponse = z.infer<typeof PublishFinalizeResponseSchema>;
export type TemplateDetailResponse = z.infer<typeof TemplateDetailResponseSchema>;
