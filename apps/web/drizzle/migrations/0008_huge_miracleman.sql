CREATE TYPE "public"."ad_campaign_status" AS ENUM('checkout_pending', 'active', 'cancel_scheduled', 'ended', 'canceled', 'suspended_policy');--> statement-breakpoint
CREATE TYPE "public"."ad_placement" AS ENUM('sidebar', 'results', 'both');--> statement-breakpoint
CREATE TABLE "ad_campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"advertiser_user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"website_url" text NOT NULL,
	"short_description" text NOT NULL,
	"logo_url" text NOT NULL,
	"logo_object_key" text NOT NULL,
	"placement" "ad_placement" NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_checkout_session_id" text,
	"stripe_subscription_id" text,
	"stripe_subscription_status" text,
	"status" "ad_campaign_status" DEFAULT 'checkout_pending' NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"checkout_expires_at" timestamp,
	"canceled_at" timestamp,
	"suspended_at" timestamp,
	"suspended_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_campaign_company_name_length_check" CHECK (char_length("ad_campaign"."company_name") >= 2 AND char_length("ad_campaign"."company_name") <= 80),
	CONSTRAINT "ad_campaign_short_description_length_check" CHECK (char_length("ad_campaign"."short_description") >= 20 AND char_length("ad_campaign"."short_description") <= 180),
	CONSTRAINT "ad_campaign_website_url_length_check" CHECK (char_length("ad_campaign"."website_url") >= 8 AND char_length("ad_campaign"."website_url") <= 500)
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_event" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_campaign" ADD CONSTRAINT "ad_campaign_advertiser_user_id_user_id_fk" FOREIGN KEY ("advertiser_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_campaign_advertiser_user_id_idx" ON "ad_campaign" USING btree ("advertiser_user_id");--> statement-breakpoint
CREATE INDEX "ad_campaign_status_idx" ON "ad_campaign" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_campaign_placement_idx" ON "ad_campaign" USING btree ("placement");--> statement-breakpoint
CREATE INDEX "ad_campaign_current_period_end_idx" ON "ad_campaign" USING btree ("current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_campaign_stripe_checkout_session_id_unique" ON "ad_campaign" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_campaign_stripe_subscription_id_unique" ON "ad_campaign" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ad_campaign_live_user_unique" ON "ad_campaign" USING btree ("advertiser_user_id") WHERE "ad_campaign"."status" in ('checkout_pending', 'active', 'cancel_scheduled');--> statement-breakpoint
CREATE INDEX "stripe_webhook_event_event_type_idx" ON "stripe_webhook_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "stripe_webhook_event_processed_at_idx" ON "stripe_webhook_event" USING btree ("processed_at");