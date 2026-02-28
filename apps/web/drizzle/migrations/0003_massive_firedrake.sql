CREATE TYPE "public"."purchase_sale_type" AS ENUM('direct', 'browsing');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "commission_override" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"direct_rate" integer NOT NULL,
	"browsing_rate" integer NOT NULL,
	"notes" text,
	"created_by_admin_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "commission_override_direct_rate_check" CHECK ("commission_override"."direct_rate" >= 0 AND "commission_override"."direct_rate" <= 100),
	CONSTRAINT "commission_override_browsing_rate_check" CHECK ("commission_override"."browsing_rate" >= 0 AND "commission_override"."browsing_rate" <= 100)
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"template_id" text NOT NULL,
	"price_cents" integer NOT NULL,
	"commission_rate" integer NOT NULL,
	"platform_fee_amount_cents" integer NOT NULL,
	"seller_payout_amount_cents" integer NOT NULL,
	"sale_type" "purchase_sale_type" NOT NULL,
	"referral_code" text,
	"stripe_payment_intent_id" text,
	"stripe_transfer_id" text,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_price_cents_check" CHECK ("purchase"."price_cents" >= 0),
	CONSTRAINT "purchase_commission_rate_check" CHECK ("purchase"."commission_rate" >= 0 AND "purchase"."commission_rate" <= 100),
	CONSTRAINT "purchase_platform_fee_check" CHECK ("purchase"."platform_fee_amount_cents" >= 0),
	CONSTRAINT "purchase_seller_payout_check" CHECK ("purchase"."seller_payout_amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_rating_check" CHECK ("review"."rating" >= 1 AND "review"."rating" <= 5),
	CONSTRAINT "review_title_length_check" CHECK ("review"."title" IS NULL OR char_length("review"."title") <= 200)
);
--> statement-breakpoint
CREATE TABLE "template" (
	"id" text PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"category" text NOT NULL,
	"zip_object_key" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"cover_image_url" text,
	"version" text NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_price_cents_check" CHECK ("template"."price_cents" >= 0),
	CONSTRAINT "template_file_size_bytes_check" CHECK ("template"."file_size_bytes" >= 0),
	CONSTRAINT "template_download_count_check" CHECK ("template"."download_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "bot_instance" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "member" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "team_member" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "bot_instance" CASCADE;--> statement-breakpoint
DROP TABLE "invitation" CASCADE;--> statement-breakpoint
DROP TABLE "member" CASCADE;--> statement-breakpoint
DROP TABLE "organization" CASCADE;--> statement-breakpoint
DROP TABLE "subscription" CASCADE;--> statement-breakpoint
DROP TABLE "team" CASCADE;--> statement-breakpoint
DROP TABLE "team_member" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "x_account_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "x_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "x_linked_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commission_override" ADD CONSTRAINT "commission_override_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_override" ADD CONSTRAINT "commission_override_created_by_admin_id_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template" ADD CONSTRAINT "template_seller_id_user_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commission_override_user_id_unique" ON "commission_override" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "commission_override_user_id_idx" ON "commission_override" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "commission_override_created_by_admin_id_idx" ON "commission_override" USING btree ("created_by_admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_buyer_template_unique" ON "purchase" USING btree ("buyer_id","template_id");--> statement-breakpoint
CREATE INDEX "purchase_buyer_id_idx" ON "purchase" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "purchase_seller_id_idx" ON "purchase" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "purchase_template_id_idx" ON "purchase" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "purchase_created_at_idx" ON "purchase" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_template_user_unique" ON "review" USING btree ("template_id","user_id");--> statement-breakpoint
CREATE INDEX "review_template_id_idx" ON "review" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "review_user_id_idx" ON "review" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_created_at_idx" ON "review" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "template_slug_unique" ON "template" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "template_seller_id_idx" ON "template" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "template_category_idx" ON "template" USING btree ("category");--> statement-breakpoint
CREATE INDEX "template_is_flagged_idx" ON "template" USING btree ("is_flagged");--> statement-breakpoint
CREATE INDEX "template_created_at_idx" ON "template" USING btree ("created_at");--> statement-breakpoint
UPDATE "user"
SET "username" = left(
	COALESCE(
		NULLIF(
			lower(regexp_replace(split_part("email", '@', 1), '[^a-z0-9_]+', '_', 'g')),
			''
		),
		'user'
	),
	30
)
WHERE "username" IS NULL;--> statement-breakpoint
WITH ranked_usernames AS (
	SELECT
		"id",
		"username",
		row_number() OVER (PARTITION BY "username" ORDER BY "created_at", "id") AS rank
	FROM "user"
)
UPDATE "user" AS target
SET "username" = CASE
	WHEN ranked.rank = 1 THEN ranked."username"
	ELSE left(
		ranked."username",
		greatest(1, 30 - length('_' || ranked.rank::text))
	) || '_' || ranked.rank::text
END
FROM ranked_usernames AS ranked
WHERE target."id" = ranked."id";--> statement-breakpoint
UPDATE "user"
SET "username" = 'user_' || substr("id", 1, 6)
WHERE "username" IS NULL OR "username" = '';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_unique" ON "user" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "user_x_account_id_unique" ON "user" USING btree ("x_account_id");--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "active_organization_id";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "active_team_id";
