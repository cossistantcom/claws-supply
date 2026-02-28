CREATE TABLE "bot_instance" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"railway_project_id" text NOT NULL,
	"railway_environment_id" text NOT NULL,
	"railway_service_id" text,
	"railway_service_name" text,
	"railway_deployment_id" text,
	"image_ref" text NOT NULL,
	"status" text DEFAULT 'not_deployed' NOT NULL,
	"success_url" text,
	"last_railway_status" text,
	"last_error" text,
	"deployed_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bot_instance_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "bot_instance_railway_service_id_unique" UNIQUE("railway_service_id")
);
--> statement-breakpoint
ALTER TABLE "bot_instance" ADD CONSTRAINT "bot_instance_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;