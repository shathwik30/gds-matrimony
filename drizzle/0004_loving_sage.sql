CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_packs_expires_at_idx" ON "contact_pack_purchases" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "conversations_last_msg_at_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "otps_expires_at_idx" ON "otps" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payments_subscription_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "users_last_active_idx" ON "users" USING btree ("last_active");