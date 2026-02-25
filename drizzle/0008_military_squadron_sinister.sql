ALTER TABLE "contact_pack_purchases" DROP CONSTRAINT "contact_pack_purchases_payment_id_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_subscription_id_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "contact_pack_purchases" ADD CONSTRAINT "contact_pack_purchases_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_action_date_idx" ON "activity_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "profile_seen_seen_user_idx" ON "profile_seen" USING btree ("seen_user_id");--> statement-breakpoint
CREATE INDEX "profile_views_viewer_recent_idx" ON "profile_views" USING btree ("viewer_id","viewed_at");--> statement-breakpoint
CREATE INDEX "profiles_completion_idx" ON "profiles" USING btree ("profile_completion");--> statement-breakpoint
CREATE INDEX "subscriptions_expiry_idx" ON "subscriptions" USING btree ("user_id","end_date");