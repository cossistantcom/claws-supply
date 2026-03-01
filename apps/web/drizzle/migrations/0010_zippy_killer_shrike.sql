CREATE TYPE "public"."purchase_event_source" AS ENUM('api', 'webhook', 'download');--> statement-breakpoint
CREATE TYPE "public"."purchase_event_type" AS ENUM('checkout_started', 'checkout_completed', 'checkout_expired', 'free_claimed', 'free_claimed_auto', 'download_completed');--> statement-breakpoint
CREATE TABLE "purchase_event" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_id" text,
	"buyer_id" text NOT NULL,
	"template_id" text NOT NULL,
	"event_type" "purchase_event_type" NOT NULL,
	"source" "purchase_event_source" NOT NULL,
	"stripe_event_id" text,
	"stripe_checkout_session_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_event" ADD CONSTRAINT "purchase_event_purchase_id_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchase"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_event" ADD CONSTRAINT "purchase_event_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_event" ADD CONSTRAINT "purchase_event_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_event_purchase_id_idx" ON "purchase_event" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_event_buyer_id_idx" ON "purchase_event" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "purchase_event_template_id_idx" ON "purchase_event" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "purchase_event_event_type_idx" ON "purchase_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "purchase_event_created_at_idx" ON "purchase_event" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_event_stripe_event_id_unique" ON "purchase_event" USING btree ("stripe_event_id") WHERE "purchase_event"."stripe_event_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_stripe_checkout_session_id_unique" ON "purchase" USING btree ("stripe_checkout_session_id");