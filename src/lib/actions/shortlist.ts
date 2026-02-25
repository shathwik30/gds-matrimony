"use server";

import { db, shortlists, users, profiles } from "@/lib/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { logActivity } from "@/lib/actions/activity";
import { getActiveSubscription } from "@/lib/actions/subscription";
import { requireAuth, checkBlocked } from "@/lib/actions/helpers";
import type { ActionResult } from "@/types";

const MAX_SHORTLIST_SIZE = 100;

export async function addToShortlist(userId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const currentUserId = authResult.userId;

    if (currentUserId === userId) {
      return { success: false, error: "You cannot shortlist yourself" };
    }

    const existing = await db.query.shortlists.findFirst({
      where: and(eq(shortlists.userId, currentUserId), eq(shortlists.shortlistedUserId, userId)),
    });

    if (existing) {
      return { success: false, error: "Already in your shortlist" };
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    if (await checkBlocked(currentUserId, userId)) {
      return { success: false, error: "Cannot shortlist this user" };
    }

    const [{ count: shortlistCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(shortlists)
      .where(eq(shortlists.userId, currentUserId));

    if (shortlistCount >= MAX_SHORTLIST_SIZE) {
      return {
        success: false,
        error: `Shortlist is full (max ${MAX_SHORTLIST_SIZE}). Please remove some profiles first.`,
      };
    }

    await db.insert(shortlists).values({
      userId: currentUserId,
      shortlistedUserId: userId,
    });

    await logActivity(currentUserId, "shortlist_added", userId);

    return { success: true, message: "Added to shortlist" };
  } catch (error) {
    console.error("Add to shortlist error:", error);
    return { success: false, error: "Failed to add to shortlist" };
  }
}

export async function removeFromShortlist(userId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const currentUserId = authResult.userId;

    await db
      .delete(shortlists)
      .where(and(eq(shortlists.userId, currentUserId), eq(shortlists.shortlistedUserId, userId)));

    await logActivity(currentUserId, "shortlist_removed", userId);

    return { success: true, message: "Removed from shortlist" };
  } catch (error) {
    console.error("Remove from shortlist error:", error);
    return { success: false, error: "Failed to remove from shortlist" };
  }
}

export interface ShortlistProfile {
  id: number;
  shortlistedUserId: number;
  createdAt: Date | null;
  profile: {
    userId: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    residingCity: string | null;
    residingState: string | null;
    highestEducation: string | null;
    occupation: string | null;
    height: number | null;
    profileCompletion: number | null;
  } | null;
}

function mapShortlistProfile(
  item: { id: number; createdAt: Date | null },
  targetUserId: number,
  profileMap: Map<number, typeof profiles.$inferSelect>
): ShortlistProfile {
  const profile = profileMap.get(targetUserId);
  return {
    id: item.id,
    shortlistedUserId: targetUserId,
    createdAt: item.createdAt,
    profile: profile
      ? {
          userId: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profileImage: profile.profileImage,
          gender: profile.gender,
          dateOfBirth: profile.dateOfBirth,
          residingCity: profile.residingCity,
          residingState: profile.residingState,
          highestEducation: profile.highestEducation,
          occupation: profile.occupation,
          height: profile.height,
          profileCompletion: profile.profileCompletion,
        }
      : null,
  };
}

export async function getMyShortlist(): Promise<ActionResult<ShortlistProfile[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const shortlistItems = await db.query.shortlists.findMany({
      where: eq(shortlists.userId, userId),
      orderBy: [desc(shortlists.createdAt)],
    });

    if (shortlistItems.length === 0) {
      return { success: true, data: [] };
    }

    const shortlistedUserIds = shortlistItems.map((item) => item.shortlistedUserId);
    const profilesList = await db.query.profiles.findMany({
      where: inArray(profiles.userId, shortlistedUserIds),
    });

    const profileMap = new Map(profilesList.map((p) => [p.userId, p]));
    const result = shortlistItems.map((item) =>
      mapShortlistProfile(item, item.shortlistedUserId, profileMap)
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("Get shortlist error:", error);
    return { success: false, error: "Failed to fetch shortlist" };
  }
}

export async function getShortlistedIds(): Promise<ActionResult<number[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const items = await db.query.shortlists.findMany({
      where: eq(shortlists.userId, userId),
      columns: { shortlistedUserId: true },
    });

    return {
      success: true,
      data: items.map((s) => s.shortlistedUserId),
    };
  } catch (error) {
    console.error("Get shortlisted IDs error:", error);
    return { success: false, error: "Failed to fetch shortlist" };
  }
}

export async function isShortlisted(userId: number): Promise<ActionResult<boolean>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const currentUserId = authResult.userId;

    const existing = await db.query.shortlists.findFirst({
      where: and(eq(shortlists.userId, currentUserId), eq(shortlists.shortlistedUserId, userId)),
    });

    return { success: true, data: !!existing };
  } catch (error) {
    console.error("Check shortlist error:", error);
    return { success: false, error: "Failed to check shortlist" };
  }
}

export async function getWhoShortlistedMe(): Promise<ActionResult<ShortlistProfile[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const subscription = await getActiveSubscription(userId);

    if (!subscription || !subscription.plan || !["gold", "platinum"].includes(subscription.plan)) {
      return { success: false, error: "Upgrade to Gold or Platinum to see who shortlisted you" };
    }

    const shortlistItems = await db.query.shortlists.findMany({
      where: eq(shortlists.shortlistedUserId, userId),
      orderBy: [desc(shortlists.createdAt)],
    });

    if (shortlistItems.length === 0) {
      return { success: true, data: [] };
    }

    const shortlisterUserIds = shortlistItems.map((item) => item.userId);
    const profilesList = await db.query.profiles.findMany({
      where: inArray(profiles.userId, shortlisterUserIds),
    });

    const profileMap = new Map(profilesList.map((p) => [p.userId, p]));
    const result = shortlistItems.map((item) => mapShortlistProfile(item, item.userId, profileMap));

    return { success: true, data: result };
  } catch (error) {
    console.error("Get who shortlisted me error:", error);
    return { success: false, error: "Failed to fetch data" };
  }
}
