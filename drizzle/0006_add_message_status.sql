-- Add message status enum and fields
CREATE TYPE "message_status" AS ENUM ('pending', 'sent', 'delivered', 'read');

-- Add status column with default
ALTER TABLE "messages"
ADD COLUMN "status" "message_status" DEFAULT 'sent' NOT NULL;

-- Add deliveredAt column
ALTER TABLE "messages"
ADD COLUMN "delivered_at" timestamp;

-- Create index on status for faster queries
CREATE INDEX "messages_status_idx" ON "messages" ("status");

-- Update existing messages to 'delivered' status if they were read
UPDATE "messages"
SET "status" = 'read'
WHERE "is_read" = true;

-- Update existing messages to 'delivered' if not read
UPDATE "messages"
SET "status" = 'delivered'
WHERE "is_read" = false;
