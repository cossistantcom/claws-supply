CREATE TABLE "device_code" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp NOT NULL,
	"status" text NOT NULL,
	"last_polled_at" timestamp,
	"polling_interval" integer,
	"client_id" text,
	"scope" text
);
--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "publisher_hash" text;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "archive_hash" text;--> statement-breakpoint
ALTER TABLE "device_code" ADD CONSTRAINT "device_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "device_code_device_code_unique" ON "device_code" USING btree ("device_code");--> statement-breakpoint
CREATE UNIQUE INDEX "device_code_user_code_unique" ON "device_code" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "device_code_user_id_idx" ON "device_code" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_code_expires_at_idx" ON "device_code" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "device_code_status_idx" ON "device_code" USING btree ("status");--> statement-breakpoint
ALTER TABLE "template" ADD CONSTRAINT "template_publisher_hash_check" CHECK ("template"."publisher_hash" IS NULL OR "template"."publisher_hash" ~ '^[a-f0-9]{64}$');--> statement-breakpoint
ALTER TABLE "template" ADD CONSTRAINT "template_archive_hash_check" CHECK ("template"."archive_hash" IS NULL OR "template"."archive_hash" ~ '^[a-f0-9]{64}$');