"use server";

import { db, blocks, users, siteSettings } from "@/lib/db";
import { eq, and, or, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { parseAdminEmails, parseUserId } from "@/lib/utils";
import type { ActionResult } from "@/types";

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

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

  if (adminEmails.length === 0) {
    console.error(
      "ADMIN_EMAILS environment variable is not configured or contains no valid emails"
    );
    return { error: { success: false, error: "Unauthorized" } };
  }

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { error: { success: false, error: "Unauthorized" } };
  }

  return { userId: authResult.userId };
}

export async function checkBlocked(userId1: number, userId2: number): Promise<boolean> {
  const blockExists = await db.query.blocks.findFirst({
    where: or(
      and(eq(blocks.blockerId, userId1), eq(blocks.blockedUserId, userId2)),
      and(eq(blocks.blockerId, userId2), eq(blocks.blockedUserId, userId1))
    ),
  });
  return !!blockExists;
}

/** Reads a single site setting from the database. Returns null if not found. */
export async function getSiteSetting(key: string): Promise<string | null> {
  try {
    const [result] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    return result?.value ?? null;
  } catch {
    return null;
  }
}

/** Returns the user IDs of all admin accounts, for filtering them out of user-facing queries. */
export async function getAdminUserIds(): Promise<number[]> {
  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (adminEmails.length === 0) return [];
  const adminUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.email, adminEmails));
  return adminUsers.map((u) => u.id);
}
