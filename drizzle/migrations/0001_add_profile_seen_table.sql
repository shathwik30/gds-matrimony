-- Migration: Add profile_seen table for repetition algorithm (PRD Section 9)
-- Created: 2026-02-09
-- Purpose: Track when users see profiles to implement cooldown logic

CREATE TABLE IF NOT EXISTS "profile_seen" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "seen_user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "last_seen" TIMESTAMP DEFAULT NOW(),
  "match_score" INTEGER DEFAULT 0,
  "view_count" INTEGER DEFAULT 1,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "profile_seen_unique_idx" ON "profile_seen" ("user_id", "seen_user_id");
CREATE INDEX IF NOT EXISTS "profile_seen_user_idx" ON "profile_seen" ("user_id");
CREATE INDEX IF NOT EXISTS "profile_seen_last_seen_idx" ON "profile_seen" ("user_id", "last_seen");

-- Add comment to table
COMMENT ON TABLE "profile_seen" IS 'Tracks when users view profiles for repetition algorithm cooldown logic';
COMMENT ON COLUMN "profile_seen"."match_score" IS 'Compatibility score at time of viewing';
COMMENT ON COLUMN "profile_seen"."view_count" IS 'Number of times this profile has been seen';
