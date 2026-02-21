"use server";

import { db, subscriptions } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/actions/helpers";
import { isUnlimited } from "@/lib/utils/subscription";
import type { ActionResult } from "@/types";

// Shared helper: get active subscription, auto-deactivating if expired
export async function getActiveSubscription(userId: number) {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.isActive, true)
    ),
    orderBy: [desc(subscriptions.createdAt)],
  });

  if (!subscription) return null;

  // Check if subscription has expired
  if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
    // Deactivate expired subscription
    await db
      .update(subscriptions)
      .set({ isActive: false })
      .where(eq(subscriptions.id, subscription.id));
    return null;
  }

  return subscription;
}

interface SubscriptionData {
  id: number;
  plan: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean | null;
  interestsPerDay: number | null;
  contactViews: number | null;
  profileBoosts: number | null;
}

// Get current user's subscription
export async function getMySubscription(): Promise<ActionResult<SubscriptionData | null>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: subscription.id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        isActive: subscription.isActive,
        interestsPerDay: subscription.interestsPerDay,
        contactViews: subscription.contactViews,
        profileBoosts: subscription.profileBoosts,
      },
    };
  } catch (error) {
    console.error("Get subscription error:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

// Check if user can perform action based on subscription
export async function checkSubscriptionLimit(
  action: "interest" | "contact_view" | "boost"
): Promise<ActionResult<{ allowed: boolean; remaining?: number }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const subscription = await getActiveSubscription(userId);

    // Free plan defaults
    let limit = action === "interest" ? 5 : action === "contact_view" ? 0 : 0;

    if (subscription) {
      if (action === "interest") {
        limit = subscription.interestsPerDay ?? 5;
      } else if (action === "contact_view") {
        limit = subscription.contactViews ?? 0;
      } else if (action === "boost") {
        limit = subscription.profileBoosts ?? 0;
      }
    }

    if (isUnlimited(limit)) {
      return { success: true, data: { allowed: true, remaining: -1 } };
    }

    return { success: true, data: { allowed: limit > 0, remaining: limit } };
  } catch (error) {
    console.error("Check subscription limit error:", error);
    return { success: false, error: "Failed to check subscription" };
  }
}

// Use a subscription feature (decrement counter)
export async function useSubscriptionFeature(
  feature: "contact_view" | "boost"
): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return { success: false, error: "No active subscription" };
    }

    if (feature === "contact_view") {
      if (!subscription.contactViews || subscription.contactViews <= 0) {
        return { success: false, error: "No contact views remaining" };
      }

      if (!isUnlimited(subscription.contactViews)) {
        // Optimistic locking to prevent double-spending
        const [updated] = await db
          .update(subscriptions)
          .set({ contactViews: subscription.contactViews - 1 })
          .where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.contactViews, subscription.contactViews)))
          .returning({ id: subscriptions.id });

        if (!updated) {
          return { success: false, error: "Please try again" };
        }
      }
    } else if (feature === "boost") {
      if (!subscription.profileBoosts || subscription.profileBoosts <= 0) {
        return { success: false, error: "No profile boosts remaining" };
      }

      if (!isUnlimited(subscription.profileBoosts)) {
        const [updated] = await db
          .update(subscriptions)
          .set({ profileBoosts: subscription.profileBoosts - 1 })
          .where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.profileBoosts, subscription.profileBoosts)))
          .returning({ id: subscriptions.id });

        if (!updated) {
          return { success: false, error: "Please try again" };
        }
      }
    }

    return { success: true, message: "Feature used successfully" };
  } catch (error) {
    console.error("Use subscription feature error:", error);
    return { success: false, error: "Failed to use feature" };
  }
}

// Activate profile boost
export async function activateProfileBoost(): Promise<ActionResult<{ expiresAt: Date }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const subscription = await getActiveSubscription(userId);

    if (!subscription) return { success: false, error: "No active subscription" };
    if (!subscription.profileBoosts || subscription.profileBoosts <= 0) {
      return { success: false, error: "No profile boosts remaining" };
    }

    if (subscription.boostExpiresAt && new Date(subscription.boostExpiresAt) > new Date()) {
      return { success: false, error: "Profile is already boosted" };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const updates: Record<string, unknown> = {
      lastBoostAt: now,
      boostExpiresAt: expiresAt,
    };
    if (!isUnlimited(subscription.profileBoosts)) {
      updates.profileBoosts = subscription.profileBoosts - 1;
    }

    // Optimistic lock to prevent double-boost
    const [updated] = await db
      .update(subscriptions)
      .set(updates)
      .where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.profileBoosts, subscription.profileBoosts!)))
      .returning({ id: subscriptions.id });

    if (!updated) {
      return { success: false, error: "Please try again" };
    }

    return { success: true, data: { expiresAt }, message: "Profile boosted for 24 hours!" };
  } catch (error) {
    console.error("Activate boost error:", error);
    return { success: false, error: "Failed to activate boost" };
  }
}

// Get boost status
export async function getBoostStatus(): Promise<ActionResult<{ isActive: boolean; expiresAt?: Date; remaining: number }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return { success: true, data: { isActive: false, remaining: 0 } };
    }

    const isActive = subscription.boostExpiresAt && new Date(subscription.boostExpiresAt) > new Date();

    return {
      success: true,
      data: {
        isActive: !!isActive,
        expiresAt: isActive && subscription.boostExpiresAt ? subscription.boostExpiresAt : undefined,
        remaining: subscription.profileBoosts || 0,
      },
    };
  } catch {
    return { success: false, error: "Failed to get boost status" };
  }
}
