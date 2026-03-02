CREATE TABLE IF NOT EXISTS "template_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_comment_id" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_comment_depth_check" CHECK ("template_comment"."depth" >= 0 AND "template_comment"."depth" <= 2)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_comment_id_template_id_unique" ON "template_comment" USING btree ("id","template_id");
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "template_comment" ADD CONSTRAINT "template_comment_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "template_comment" ADD CONSTRAINT "template_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "template_comment" ADD CONSTRAINT "template_comment_parent_comment_id_template_id_fk" FOREIGN KEY ("parent_comment_id","template_id") REFERENCES "public"."template_comment"("id","template_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_comment_template_parent_created_idx" ON "template_comment" USING btree ("template_id","parent_comment_id","created_at","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_comment_template_created_idx" ON "template_comment" USING btree ("template_id","created_at","id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_comment_parent_comment_id_idx" ON "template_comment" USING btree ("parent_comment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_comment_user_id_idx" ON "template_comment" USING btree ("user_id");
