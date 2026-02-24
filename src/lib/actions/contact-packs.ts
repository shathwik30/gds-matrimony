"use server";

import { db, contactPackPurchases, subscriptions, users } from "@/lib/db";
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

// Get total remaining contact views (packs + subscription combined)
export async function getTotalContactViews(): Promise<ActionResult<{ total: number; fromPacks: number; fromSubscription: number; isUnlimitedSub: boolean }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Get pack balance
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
    const fromPacks = packs.reduce((sum, pack) => sum + pack.contactsRemaining, 0);

    // Get subscription contact views
    const subscription = await getActiveSubscription(userId);
    const subViews = subscription?.contactViews ?? 0;
    const unlimitedSub = isUnlimited(subViews);
    const fromSubscription = unlimitedSub ? 0 : Math.max(0, subViews);

    return {
      success: true,
      data: {
        total: unlimitedSub ? -1 : fromPacks + fromSubscription,
        fromPacks,
        fromSubscription,
        isUnlimitedSub: unlimitedSub,
      },
    };
  } catch (error) {
    console.error("Get total contact views error:", error);
    return { success: false, error: "Failed to get contact views" };
  }
}

// Reveal contact info for a profile by spending one contact view
export async function revealContact(
  targetUserId: number
): Promise<ActionResult<{ email?: string; phone?: string }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    if (userId === targetUserId) {
      return { success: false, error: "Cannot reveal your own contact" };
    }

    // Deduct a contact view (from packs first, then subscription)
    // eslint-disable-next-line react-hooks/rules-of-hooks -- useContactView is a server action, not a React hook
    const deductResult = await useContactView(targetUserId);
    if (!deductResult.success) {
      return { success: false, error: deductResult.error || "No contact views remaining" };
    }

    // Fetch the target user's contact info
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      columns: { email: true, phoneNumber: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      data: {
        email: targetUser.email || undefined,
        phone: targetUser.phoneNumber || undefined,
      },
      message: deductResult.message,
    };
  } catch (error) {
    console.error("Reveal contact error:", error);
    return { success: false, error: "Failed to reveal contact" };
  }
}
