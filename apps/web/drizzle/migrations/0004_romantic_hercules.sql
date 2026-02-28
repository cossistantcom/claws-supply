CREATE TYPE "public"."template_status" AS ENUM('draft', 'published', 'unpublished', 'deleted');--> statement-breakpoint
CREATE TABLE "template_version" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"version" text NOT NULL,
	"zip_object_key" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_version_file_size_bytes_check" CHECK ("template_version"."file_size_bytes" >= 0)
);
--> statement-breakpoint
ALTER TABLE "template" ALTER COLUMN "zip_object_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "template" ALTER COLUMN "file_size_bytes" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "template" ALTER COLUMN "version" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "status" "template_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "unpublished_at" timestamp;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "template_version" ADD CONSTRAINT "template_version_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_version" ADD CONSTRAINT "template_version_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "template_version_template_version_unique" ON "template_version" USING btree ("template_id","version");--> statement-breakpoint
CREATE INDEX "template_version_template_id_idx" ON "template_version" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_version_created_at_idx" ON "template_version" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "template_status_idx" ON "template" USING btree ("status");