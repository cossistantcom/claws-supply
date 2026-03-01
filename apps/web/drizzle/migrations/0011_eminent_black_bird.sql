CREATE TABLE "stripe_connect_webhook_event" (
	"event_id" text NOT NULL,
	"account_id" text NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_connect_webhook_event_pkey" PRIMARY KEY("event_id","account_id")
);
--> statement-breakpoint
CREATE INDEX "stripe_connect_webhook_event_account_id_idx" ON "stripe_connect_webhook_event" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "stripe_connect_webhook_event_event_type_idx" ON "stripe_connect_webhook_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "stripe_connect_webhook_event_processed_at_idx" ON "stripe_connect_webhook_event" USING btree ("processed_at");