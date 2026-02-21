CREATE TYPE "public"."purchase_type" AS ENUM('subscription', 'contact_pack_10', 'contact_pack_25', 'contact_pack_50');--> statement-breakpoint
CREATE TABLE "contact_pack_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"payment_id" integer,
	"pack_size" integer NOT NULL,
	"contacts_remaining" integer NOT NULL,
	"purchased_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "message_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"attachment_url" text NOT NULL,
	"attachment_type" varchar(50) DEFAULT 'image',
	"file_name" varchar(255),
	"file_size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profile_seen" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"seen_user_id" integer NOT NULL,
	"last_seen" timestamp DEFAULT now(),
	"match_score" integer DEFAULT 0,
	"view_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "typing_indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"last_typing_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "has_attachment" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "purchase_type" "purchase_type";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "contact_pack_size" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_boost_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "boost_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "contact_pack_purchases" ADD CONSTRAINT "contact_pack_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_pack_purchases" ADD CONSTRAINT "contact_pack_purchases_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_seen" ADD CONSTRAINT "profile_seen_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_seen" ADD CONSTRAINT "profile_seen_seen_user_id_users_id_fk" FOREIGN KEY ("seen_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_packs_user_idx" ON "contact_pack_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_attachments_message_idx" ON "message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_seen_unique_idx" ON "profile_seen" USING btree ("user_id","seen_user_id");--> statement-breakpoint
CREATE INDEX "profile_seen_user_idx" ON "profile_seen" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_seen_last_seen_idx" ON "profile_seen" USING btree ("user_id","last_seen");--> statement-breakpoint
CREATE UNIQUE INDEX "typing_indicator_unique" ON "typing_indicators" USING btree ("conversation_id","user_id");