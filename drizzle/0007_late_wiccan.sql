-- Add missing indexes for security audit fixes
CREATE INDEX IF NOT EXISTS "blocks_blocked_user_idx" ON "blocks" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_packs_payment_idx" ON "contact_pack_purchases" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interests_status_idx" ON "interests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_receiver_unread_idx" ON "messages" USING btree ("receiver_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpay_payment_id_idx" ON "payments" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_hide_profile_idx" ON "profiles" USING btree ("hide_profile");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profiles_trust_level_idx" ON "profiles" USING btree ("trust_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shortlists_shortlisted_user_idx" ON "shortlists" USING btree ("shortlisted_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verifications_type_idx" ON "verifications" USING btree ("type");
