"use server";

import { db, profileViews, interests, shortlists, profiles, messages, activityLogs } from "@/lib/db";
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";
import { getActiveSubscription } from "@/lib/actions/subscription";
import { requireAuth } from "@/lib/actions/helpers";
import { calculateAge } from "@/lib/utils";
import type { ActionResult, DashboardStats } from "@/types";

interface ProfileViewData {
  id: number;
  viewerId: number;
  viewedAt: Date | null;
  viewer: {
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    age?: number;
    residingCity: string | null;
  };
}

interface ActivityItem {
  id: number;
  type: "view" | "interest_received" | "interest_accepted" | "shortlist";
  title: string;
  description: string;
  createdAt: Date;
  user?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}

// Record a profile view
export async function recordProfileView(viewedUserId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const viewerId = authResult.userId;

    if (viewerId === viewedUserId) {
      return { success: true }; // Don't record self-views
    }

    // Check if already viewed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingView = await db.query.profileViews.findFirst({
      where: and(
        eq(profileViews.viewerId, viewerId),
        eq(profileViews.viewedUserId, viewedUserId),
        gte(profileViews.viewedAt, today)
      ),
    });

    if (!existingView) {
      await db.insert(profileViews).values({
        viewerId,
        viewedUserId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Record profile view error:", error);
    return { success: false, error: "Failed to record view" };
  }
}

// Get profiles that I have viewed
export async function getViewedByMe(
  limit: number = 30
): Promise<ActionResult<ProfileViewData[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const safeLimit = Math.min(Math.max(1, limit), 50);

    const views = await db.query.profileViews.findMany({
      where: eq(profileViews.viewerId, userId),
      orderBy: [desc(profileViews.viewedAt)],
      limit: safeLimit,
    });

    if (views.length === 0) {
      return { success: true, data: [] };
    }

    const viewedIds = views.map((view) => view.viewedUserId);
    const viewedProfiles = await db.query.profiles.findMany({
      where: inArray(profiles.userId, viewedIds),
    });
    const profileMap = new Map(viewedProfiles.map((p) => [p.userId, p]));

    const formattedViews: ProfileViewData[] = [];
    for (const view of views) {
      const viewedProfile = profileMap.get(view.viewedUserId);
      if (viewedProfile) {
        formattedViews.push({
          id: view.id,
          viewerId: view.viewedUserId,
          viewedAt: view.viewedAt,
          viewer: {
            firstName: viewedProfile.firstName,
            lastName: viewedProfile.lastName,
            profileImage: viewedProfile.profileImage,
            residingCity: viewedProfile.residingCity,
            age: viewedProfile.dateOfBirth
              ? calculateAge(viewedProfile.dateOfBirth)
              : undefined,
          },
        });
      }
    }

    return { success: true, data: formattedViews };
  } catch (error) {
    console.error("Get viewed by me error:", error);
    return { success: false, error: "Failed to fetch viewed profiles" };
  }
}

// Get who viewed my profile (requires subscription with seeProfileViewers)
export async function getProfileViewers(
  limit: number = 20
): Promise<ActionResult<ProfileViewData[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Check subscription allows viewing profile viewers (Silver+ only)
    const subscription = await getActiveSubscription(userId);
    const plan = subscription?.plan || "free";
    const canSeeViewers = ["silver", "gold", "platinum"].includes(plan);

    if (!canSeeViewers) {
      return { success: false, error: "Upgrade to Silver or higher to see who viewed your profile" };
    }

    const safeLimit = Math.min(Math.max(1, limit), 50);

    const views = await db.query.profileViews.findMany({
      where: eq(profileViews.viewedUserId, userId),
      orderBy: [desc(profileViews.viewedAt)],
      limit: safeLimit,
    });

    if (views.length === 0) {
      return { success: true, data: [] };
    }

    // Batch fetch all viewer profiles at once
    const viewerIds = views.map((view) => view.viewerId);
    const viewerProfiles = await db.query.profiles.findMany({
      where: inArray(profiles.userId, viewerIds),
    });
    const profileMap = new Map(viewerProfiles.map((p) => [p.userId, p]));

    const formattedViews: ProfileViewData[] = [];
    for (const view of views) {
      const viewerProfile = profileMap.get(view.viewerId);
      if (viewerProfile) {
        formattedViews.push({
          id: view.id,
          viewerId: view.viewerId,
          viewedAt: view.viewedAt,
          viewer: {
            firstName: viewerProfile.firstName,
            lastName: viewerProfile.lastName,
            profileImage: viewerProfile.profileImage,
            residingCity: viewerProfile.residingCity,
            age: viewerProfile.dateOfBirth
              ? Math.floor(
                  (Date.now() - new Date(viewerProfile.dateOfBirth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
              : undefined,
          },
        });
      }
    }

    return { success: true, data: formattedViews };
  } catch (error) {
    console.error("Get profile viewers error:", error);
    return { success: false, error: "Failed to fetch viewers" };
  }
}

// Get recent activity
export async function getRecentActivity(
  limit: number = 20
): Promise<ActionResult<ActivityItem[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Check subscription for feature gating
    const subscription = await getActiveSubscription(userId);
    const plan = subscription?.plan || "free";
    const canSeeViewers = ["silver", "gold", "platinum"].includes(plan);
    const canSeeWhoLiked = ["gold", "platinum"].includes(plan);

    const activities: ActivityItem[] = [];

    // Fetch data based on subscription level
    const [views, receivedInterests] = await Promise.all([
      // Profile views: only fetch if Silver+ can see viewers
      canSeeViewers
        ? db.query.profileViews.findMany({
            where: eq(profileViews.viewedUserId, userId),
            orderBy: [desc(profileViews.viewedAt)],
            limit: 10,
          })
        : Promise.resolve([]),
      // Received interests: only fetch if Gold+ can see who liked them
      canSeeWhoLiked
        ? db.query.interests.findMany({
            where: eq(interests.receiverId, userId),
            orderBy: [desc(interests.createdAt)],
            limit: 10,
          })
        : Promise.resolve([]),
    ]);

    // Collect all user IDs that need profile lookup
    const userIdsToFetch = new Set<number>();
    views.forEach((view) => userIdsToFetch.add(view.viewerId));
    receivedInterests.forEach((interest) => userIdsToFetch.add(interest.senderId));

    // Batch fetch all profiles at once
    let profileMap = new Map<number, typeof profiles.$inferSelect>();
    if (userIdsToFetch.size > 0) {
      const profilesList = await db.query.profiles.findMany({
        where: inArray(profiles.userId, Array.from(userIdsToFetch)),
      });
      profileMap = new Map(profilesList.map((p) => [p.userId, p]));
    }

    // Process views
    for (const view of views) {
      const viewerProfile = profileMap.get(view.viewerId);
      if (viewerProfile) {
        activities.push({
          id: view.id,
          type: "view",
          title: "Profile Viewed",
          description: `${viewerProfile.firstName || "Someone"} viewed your profile`,
          createdAt: view.viewedAt || new Date(),
          user: {
            id: view.viewerId,
            firstName: viewerProfile.firstName,
            lastName: viewerProfile.lastName,
            profileImage: viewerProfile.profileImage,
          },
        });
      }
    }

    // Process interests
    for (const interest of receivedInterests) {
      const senderProfile = profileMap.get(interest.senderId);
      if (senderProfile) {
        activities.push({
          id: -(interest.id), // Negative ID to avoid collision with view IDs
          type: "interest_received",
          title: interest.status === "accepted" ? "Interest Accepted" : "Interest Received",
          description:
            interest.status === "accepted"
              ? `You accepted ${senderProfile.firstName}'s interest`
              : `${senderProfile.firstName || "Someone"} sent you an interest`,
          createdAt: interest.createdAt || new Date(),
          user: {
            id: interest.senderId,
            firstName: senderProfile.firstName,
            lastName: senderProfile.lastName,
            profileImage: senderProfile.profileImage,
          },
        });
      }
    }

    // Sort by date
    activities.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { success: true, data: activities.slice(0, limit) };
  } catch (error) {
    console.error("Get recent activity error:", error);
    return { success: false, error: "Failed to fetch activity" };
  }
}

// Get dashboard stats
export async function getDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run all count queries in parallel for better performance
    const [
      [totalViewsResult],
      [todayViewsResult],
      [viewedByMeResult],
      [todayViewedByMeResult],
      [sentInterestsResult],
      [receivedInterestsResult],
      [acceptedInterestsResult],
      [pendingInterestsResult],
      [shortlistedResult],
      [unreadMessagesResult],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(profileViews).where(eq(profileViews.viewedUserId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(profileViews).where(and(eq(profileViews.viewedUserId, userId), gte(profileViews.viewedAt, today))),
      db.select({ count: sql<number>`count(*)` }).from(profileViews).where(eq(profileViews.viewerId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(profileViews).where(and(eq(profileViews.viewerId, userId), gte(profileViews.viewedAt, today))),
      db.select({ count: sql<number>`count(*)` }).from(interests).where(eq(interests.senderId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(interests).where(eq(interests.receiverId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(interests).where(and(eq(interests.receiverId, userId), eq(interests.status, "accepted"))),
      db.select({ count: sql<number>`count(*)` }).from(interests).where(and(eq(interests.receiverId, userId), eq(interests.status, "pending"))),
      db.select({ count: sql<number>`count(*)` }).from(shortlists).where(eq(shortlists.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.receiverId, userId), eq(messages.isRead, false))),
    ]);

    return {
      success: true,
      data: {
        profileViews: Number(totalViewsResult?.count || 0),
        todayViews: Number(todayViewsResult?.count || 0),
        profilesViewedByMe: Number(viewedByMeResult?.count || 0),
        todayViewsByMe: Number(todayViewedByMeResult?.count || 0),
        interestsSent: Number(sentInterestsResult?.count || 0),
        interestsReceived: Number(receivedInterestsResult?.count || 0),
        acceptedInterests: Number(acceptedInterestsResult?.count || 0),
        pendingInterests: Number(pendingInterestsResult?.count || 0),
        shortlisted: Number(shortlistedResult?.count || 0),
        unreadMessages: Number(unreadMessagesResult?.count || 0),
      },
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

// Helper function to log user activity
export async function logActivity(
  userId: number,
  action: string,
  targetUserId?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      targetUserId: targetUserId || null,
      metadata: metadata || null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Silent fail - don't break user flow if activity logging fails
    console.error("Failed to log activity:", error);
  }
}
