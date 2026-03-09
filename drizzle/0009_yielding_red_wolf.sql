CREATE TYPE "public"."user_role" AS ENUM('user', 'staff');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_by_staff_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_staff_id_users_id_fk" FOREIGN KEY ("created_by_staff_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_created_by_staff_idx" ON "users" USING btree ("created_by_staff_id");