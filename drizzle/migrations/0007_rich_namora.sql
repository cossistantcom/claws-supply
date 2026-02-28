ALTER TABLE "template" ALTER COLUMN "version" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "template_version" ALTER COLUMN "version" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "version_notes" text;--> statement-breakpoint
ALTER TABLE "template_version" ADD COLUMN "release_notes" text;
