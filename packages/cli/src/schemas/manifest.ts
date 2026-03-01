import { z } from "zod";

export const ManifestSchema = z.object({
  id: z.string().trim().min(1).max(200),
  version: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  publisherHash: z.string().regex(/^[a-f0-9]{64}$/),
  publishedAt: z.string().datetime({ offset: true }),
  fileHashes: z.record(z.string().min(1), z.string().regex(/^sha256:[a-f0-9]{64}$/)),
});

export type Manifest = z.infer<typeof ManifestSchema>;
