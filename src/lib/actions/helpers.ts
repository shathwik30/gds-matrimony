"use server";

import { db, blocks, users } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { parseUserId } from "@/lib/utils";
import type { ActionResult } from "@/types";

// ── Auth ────────────────────────────────────────────────────────────────

/**
 * Authenticate the current session and return the numeric userId.
 * Returns an ActionResult error when the user is not authenticated.
 */
export async function requireAuth(): Promise<
  { userId: number; error?: never } | { userId?: never; error: ActionResult<never> }
> {
  const session = await auth();
  const userId = parseUserId(session?.user?.id);
  if (!userId) {
    return { error: { success: false, error: "Not authenticated" } };
  }
  return { userId };
}

/**
 * Authenticate + verify admin access. Returns the admin's userId or an error.
 * Admin access is controlled via the ADMIN_EMAILS environment variable.
 */
export async function requireAdmin(): Promise<
  { userId: number; error?: never } | { userId?: never; error: ActionResult<never> }
> {
  const authResult = await requireAuth();
  if (authResult.error) return { error: authResult.error };

  const user = await db.query.users.findFirst({
    where: eq(users.id, authResult.userId),
  });

  if (!user?.email) {
    return { error: { success: false, error: "Unauthorized" } };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const adminEmails = (process.env.ADMIN_EMAILS?.split(",") || [])
    .map(e => e.trim().toLowerCase())
    .filter(e => emailRegex.test(e));

  if (adminEmails.length === 0) {
    console.error("ADMIN_EMAILS environment variable is not configured or contains no valid emails");
    return { error: { success: false, error: "Unauthorized" } };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { error: { success: false, error: "Unauthorized" } };
  }

  return { userId: authResult.userId };
}

// ── Block checks ────────────────────────────────────────────────────────

/**
 * Check if either user has blocked the other (bidirectional).
 */
export async function checkBlocked(userId1: number, userId2: number): Promise<boolean> {
  const blockExists = await db.query.blocks.findFirst({
    where: or(
      and(eq(blocks.blockerId, userId1), eq(blocks.blockedUserId, userId2)),
      and(eq(blocks.blockerId, userId2), eq(blocks.blockedUserId, userId1))
    ),
  });
  return !!blockExists;
}

