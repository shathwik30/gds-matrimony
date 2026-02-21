"use server";

import { db, contactPackPurchases, subscriptions } from "@/lib/db";
import { eq, and, gt, or, isNull, gte } from "drizzle-orm";
import { getActiveSubscription } from "@/lib/actions/subscription";
import { requireAuth } from "@/lib/actions/helpers";
import { isUnlimited } from "@/lib/utils/subscription";
import type { ActionResult } from "@/types";

// Get user's total contact pack balance (only non-expired packs)
export async function getContactPackBalance(): Promise<ActionResult<number>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const now = new Date();
    const packs = await db.query.contactPackPurchases.findMany({
      where: and(
        eq(contactPackPurchases.userId, userId),
        gt(contactPackPurchases.contactsRemaining, 0),
        or(
          isNull(contactPackPurchases.expiresAt),
          gte(contactPackPurchases.expiresAt, now)
        )
      ),
    });

    const total = packs.reduce((sum, pack) => sum + pack.contactsRemaining, 0);
    return { success: true, data: total };
  } catch (error) {
    console.error("Get contact pack balance error:", error);
    return { success: false, error: "Failed to get balance" };
  }
}

// Use a contact view (deduct from pack or subscription) with optimistic locking
export async function useContactView(viewedUserId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    if (userId === viewedUserId) {
      return { success: true, message: "Viewing own contact" };
    }

    const now = new Date();

    // Try packs first (FIFO - oldest non-expired pack first) with optimistic locking
    const pack = await db.query.contactPackPurchases.findFirst({
      where: and(
        eq(contactPackPurchases.userId, userId),
        gt(contactPackPurchases.contactsRemaining, 0),
        or(
          isNull(contactPackPurchases.expiresAt),
          gte(contactPackPurchases.expiresAt, now)
        )
      ),
      orderBy: (packs, { asc }) => [asc(packs.purchasedAt)],
    });

    if (pack) {
      // Optimistic lock: only decrement if remaining count hasn't changed
      const [updated] = await db
        .update(contactPackPurchases)
        .set({ contactsRemaining: pack.contactsRemaining - 1 })
        .where(and(
          eq(contactPackPurchases.id, pack.id),
          eq(contactPackPurchases.contactsRemaining, pack.contactsRemaining)
        ))
        .returning({ id: contactPackPurchases.id });

      if (!updated) {
        return { success: false, error: "Please try again" };
      }
      return { success: true, message: "Contact viewed (from pack)" };
    }

    // Fallback to subscription contactViews with optimistic locking
    const subscription = await getActiveSubscription(userId);

    if (subscription && subscription.contactViews !== null && subscription.contactViews > 0) {
      // Unlimited subscribers (e.g. Platinum) don't need decrement
      if (isUnlimited(subscription.contactViews)) {
        return { success: true, message: "Contact viewed (unlimited subscription)" };
      }

      const [updated] = await db
        .update(subscriptions)
        .set({ contactViews: subscription.contactViews - 1, updatedAt: new Date() })
        .where(and(
          eq(subscriptions.id, subscription.id),
          eq(subscriptions.contactViews, subscription.contactViews)
        ))
        .returning({ id: subscriptions.id });

      if (!updated) {
        return { success: false, error: "Please try again" };
      }
      return { success: true, message: "Contact viewed (from subscription)" };
    }

    return { success: false, error: "No contact views remaining" };
  } catch (error) {
    console.error("Use contact view error:", error);
    return { success: false, error: "Failed to use contact view" };
  }
}

// Get user's contact pack purchases history
export async function getContactPackPurchases(): Promise<ActionResult<typeof contactPackPurchases.$inferSelect[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const purchases = await db.query.contactPackPurchases.findMany({
      where: eq(contactPackPurchases.userId, userId),
      orderBy: (packs, { desc }) => [desc(packs.purchasedAt)],
      limit: 50,
    });

    return { success: true, data: purchases };
  } catch (error) {
    console.error("Get contact pack purchases error:", error);
    return { success: false, error: "Failed to get purchases" };
  }
}
