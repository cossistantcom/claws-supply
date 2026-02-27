ALTER TABLE "subscription" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;