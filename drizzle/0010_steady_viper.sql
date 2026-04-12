ALTER TABLE "users" DROP CONSTRAINT "users_created_by_staff_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_married" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "secondary_password" text;