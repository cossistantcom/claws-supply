import { z } from "zod";
import { slugParamSchema } from "@/lib/templates/schemas";

export const createPurchaseCheckoutSchema = z
  .object({
    templateSlug: slugParamSchema.shape.slug,
    ref: z
      .string()
      .trim()
      .min(1, "ref must be at least 1 character.")
      .max(120, "ref must be 120 characters or less.")
      .optional(),
  })
  .strict();

export type CreatePurchaseCheckoutInput = z.infer<typeof createPurchaseCheckoutSchema>;
