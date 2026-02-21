"use server";

import { db, users, profiles, subscriptions, payments, interests, messages, reports, verifications, profileViews, siteSettings, contactSubmissions } from "@/lib/db";
import { eq, and, desc, sql, gte, lte, count, ne, inArray, type SQL } from "drizzle-orm";
import { requireAdmin } from "@/lib/actions/helpers";
import type { ActionResult } from "@/types";

// Dashboard Analytics
export interface DashboardAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  maleUsers: number;
  femaleUsers: number;
  verifiedProfiles: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalInterests: number;
  acceptedInterests: number;
  pendingReports: number;
  pendingVerifications: number;
}

export async function getAdminDashboard(): Promise<ActionResult<DashboardAnalytics>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all count queries in parallel
    const [
      [totalUsersResult],
      [activeUsersResult],
      [newUsersTodayResult],
      [newUsersWeekResult],
      [newUsersMonthResult],
      [maleUsersResult],
      [femaleUsersResult],
      [verifiedProfilesResult],
      [totalSubscriptionsResult],
      [activeSubscriptionsResult],
      [totalRevenueResult],
      [monthRevenueResult],
      [totalInterestsResult],
      [acceptedInterestsResult],
      [pendingReportsResult],
      [pendingVerificationsResult],
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, todayStart)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, weekAgo)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, monthAgo)),
      db.select({ count: count() }).from(profiles).where(eq(profiles.gender, "male")),
      db.select({ count: count() }).from(profiles).where(eq(profiles.gender, "female")),
      db.select({ count: count() }).from(profiles).where(eq(profiles.trustLevel, "verified_user")),
      db.select({ count: count() }).from(subscriptions).where(ne(subscriptions.plan, "free")),
      db.select({ count: count() }).from(subscriptions).where(and(eq(subscriptions.isActive, true), ne(subscriptions.plan, "free"))),
      db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "completed")),
      db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(and(eq(payments.status, "completed"), gte(payments.createdAt, monthStart))),
      db.select({ count: count() }).from(interests),
      db.select({ count: count() }).from(interests).where(eq(interests.status, "accepted")),
      db.select({ count: count() }).from(reports).where(eq(reports.status, "pending")),
      db.select({ count: count() }).from(verifications).where(eq(verifications.status, "pending")),
    ]);

    return {
      success: true,
      data: {
        totalUsers: totalUsersResult.count,
        activeUsers: activeUsersResult.count,
        newUsersToday: newUsersTodayResult.count,
        newUsersThisWeek: newUsersWeekResult.count,
        newUsersThisMonth: newUsersMonthResult.count,
        maleUsers: maleUsersResult.count,
        femaleUsers: femaleUsersResult.count,
        verifiedProfiles: verifiedProfilesResult.count,
        totalSubscriptions: totalSubscriptionsResult.count,
        activeSubscriptions: activeSubscriptionsResult.count,
        totalRevenue: Number(totalRevenueResult.sum) || 0,
        revenueThisMonth: Number(monthRevenueResult.sum) || 0,
        totalInterests: totalInterestsResult.count,
        acceptedInterests: acceptedInterestsResult.count,
        pendingReports: pendingReportsResult.count,
        pendingVerifications: pendingVerificationsResult.count,
      },
    };
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

// User Management
export interface AdminUser {
  id: number;
  email: string;
  emailVerified: boolean | null;
  phoneNumber: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  lastActive: Date | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    gender: string | null;
    profileImage: string | null;
    profileCompletion: number | null;
    trustLevel: string | null;
  } | null;
  subscription: {
    plan: string | null;
    isActive: boolean | null;
    endDate: Date | null;
  } | null;
}

export async function getAdminUsers(
  page: number = 1,
  limit: number = 20,
  search?: string,
  filter?: string
): Promise<ActionResult<{ users: AdminUser[]; total: number }>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    // Validate pagination params
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;

    // Build filter conditions
    const conditions = [];
    if (filter === "active") conditions.push(eq(users.isActive, true));
    else if (filter === "inactive") conditions.push(eq(users.isActive, false));

    // Search by email (safe SQL pattern)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      conditions.push(sql`LOWER(${users.email}) LIKE ${searchTerm}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get users with profiles and subscriptions
    const usersList = await db.query.users.findMany({
      where: whereClause,
      with: {
        profile: true,
        subscriptions: {
          where: eq(subscriptions.isActive, true),
          limit: 1,
        },
      },
      orderBy: [desc(users.createdAt)],
      limit: validatedLimit,
      offset,
    });

    const [totalResult] = await db.select({ count: count() }).from(users).where(whereClause);

    const formattedUsers: AdminUser[] = usersList.map((user) => ({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            gender: user.profile.gender,
            profileImage: user.profile.profileImage,
            profileCompletion: user.profile.profileCompletion,
            trustLevel: user.profile.trustLevel,
          }
        : null,
      subscription: user.subscriptions[0]
        ? {
            plan: user.subscriptions[0].plan,
            isActive: user.subscriptions[0].isActive,
            endDate: user.subscriptions[0].endDate,
          }
        : null,
    }));

    return {
      success: true,
      data: {
        users: formattedUsers,
        total: totalResult.count,
      },
    };
  } catch (error) {
    console.error("Get admin users error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

// Get single user details
export async function getAdminUserDetails(userId: number): Promise<ActionResult<AdminUser & {
  interestsSent: number;
  interestsReceived: number;
  profileViews: number;
  messagesCount: number;
}>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
        subscriptions: {
          where: eq(subscriptions.isActive, true),
          limit: 1,
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Get additional stats in parallel
    const [
      [interestsSentResult],
      [interestsReceivedResult],
      [profileViewsResult],
      [messagesResult],
    ] = await Promise.all([
      db.select({ count: count() }).from(interests).where(eq(interests.senderId, userId)),
      db.select({ count: count() }).from(interests).where(eq(interests.receiverId, userId)),
      db.select({ count: count() }).from(profileViews).where(eq(profileViews.viewedUserId, userId)),
      db.select({ count: count() }).from(messages).where(eq(messages.senderId, userId)),
    ]);

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        profile: user.profile
          ? {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              gender: user.profile.gender,
              profileImage: user.profile.profileImage,
              profileCompletion: user.profile.profileCompletion,
              trustLevel: user.profile.trustLevel,
            }
          : null,
        subscription: user.subscriptions[0]
          ? {
              plan: user.subscriptions[0].plan,
              isActive: user.subscriptions[0].isActive,
              endDate: user.subscriptions[0].endDate,
            }
          : null,
        interestsSent: interestsSentResult.count,
        interestsReceived: interestsReceivedResult.count,
        profileViews: profileViewsResult.count,
        messagesCount: messagesResult.count,
      },
    };
  } catch (error) {
    console.error("Get user details error:", error);
    return { success: false, error: "Failed to fetch user details" };
  }
}

// Suspend/Activate user
export async function toggleUserStatus(userId: number, isActive: boolean): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    await db.update(users).set({ isActive }).where(eq(users.id, userId));

    return {
      success: true,
      message: isActive ? "User activated successfully" : "User suspended successfully",
    };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

// Verify user profile
export async function verifyUserProfile(userId: number, trustLevel: "new_member" | "verified_user" | "highly_trusted"): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    await db.update(profiles).set({ trustLevel }).where(eq(profiles.userId, userId));

    return {
      success: true,
      message: "Profile verification updated",
    };
  } catch (error) {
    console.error("Verify profile error:", error);
    return { success: false, error: "Failed to verify profile" };
  }
}

// Get pending verifications
export interface PendingVerification {
  id: number;
  userId: number;
  type: string;
  documentUrl: string | null;
  status: string | null;
  createdAt: Date | null;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function getPendingVerifications(): Promise<ActionResult<PendingVerification[]>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const pending = await db.query.verifications.findMany({
      where: eq(verifications.status, "pending"),
      orderBy: [desc(verifications.createdAt)],
      limit: 100, // Add pagination limit
    });

    if (pending.length === 0) {
      return { success: true, data: [] };
    }

    // Batch fetch all users at once
    const userIds = pending.map((v) => v.userId);
    const usersList = await db.query.users.findMany({
      where: inArray(users.id, userIds),
      with: { profile: true },
    });
    const userMap = new Map(usersList.map((u) => [u.id, u]));

    const formatted: PendingVerification[] = [];
    for (const v of pending) {
      const user = userMap.get(v.userId);
      if (user) {
        formatted.push({
          id: v.id,
          userId: v.userId,
          type: v.type,
          documentUrl: v.documentUrl,
          status: v.status,
          createdAt: v.createdAt,
          user: {
            email: user.email,
            firstName: user.profile?.firstName || null,
            lastName: user.profile?.lastName || null,
          },
        });
      }
    }

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Get verifications error:", error);
    return { success: false, error: "Failed to fetch verifications" };
  }
}

// Process verification
export async function processVerification(
  verificationId: number,
  status: "verified" | "rejected",
  rejectionReason?: string
): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    // Read verification first to get userId before updating
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.id, verificationId),
    });

    if (!verification) {
      return { success: false, error: "Verification not found" };
    }

    if (verification.status !== "pending") {
      return { success: false, error: "Verification already processed" };
    }

    await db
      .update(verifications)
      .set({
        status,
        verifiedAt: status === "verified" ? new Date() : null,
        verifiedBy: adminResult.userId,
        rejectionReason: status === "rejected" ? rejectionReason : null,
      })
      .where(and(eq(verifications.id, verificationId), eq(verifications.status, "pending")));

    // Update profile trust level if verified
    if (status === "verified") {
      await db
        .update(profiles)
        .set({ trustLevel: "verified_user" })
        .where(eq(profiles.userId, verification.userId));
    }

    return {
      success: true,
      message: status === "verified" ? "Verification approved" : "Verification rejected",
    };
  } catch (error) {
    console.error("Process verification error:", error);
    return { success: false, error: "Failed to process verification" };
  }
}

// Get reports
export interface AdminReport {
  id: number;
  reporterId: number;
  reportedUserId: number;
  reason: string;
  description: string | null;
  status: string | null;
  createdAt: Date | null;
  reporter: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  reported: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

const VALID_REPORT_STATUSES = ["pending", "resolved", "dismissed"] as const;

export async function getAdminReports(status?: string): Promise<ActionResult<AdminReport[]>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    // Validate status against allowed values
    const validatedStatus = status && VALID_REPORT_STATUSES.includes(status as typeof VALID_REPORT_STATUSES[number])
      ? status
      : undefined;

    const reportsList = await db.query.reports.findMany({
      where: validatedStatus ? eq(reports.status, validatedStatus) : undefined,
      orderBy: [desc(reports.createdAt)],
      limit: 100, // Add pagination limit
    });

    if (reportsList.length === 0) {
      return { success: true, data: [] };
    }

    // Collect all unique user IDs
    const userIds = new Set<number>();
    reportsList.forEach((report) => {
      userIds.add(report.reporterId);
      userIds.add(report.reportedUserId);
    });

    // Batch fetch all users at once
    const usersList = await db.query.users.findMany({
      where: inArray(users.id, Array.from(userIds)),
      with: { profile: true },
    });
    const userMap = new Map(usersList.map((u) => [u.id, u]));

    const formatted: AdminReport[] = [];
    for (const report of reportsList) {
      const reporter = userMap.get(report.reporterId);
      const reported = userMap.get(report.reportedUserId);

      if (reporter && reported) {
        formatted.push({
          id: report.id,
          reporterId: report.reporterId,
          reportedUserId: report.reportedUserId,
          reason: report.reason,
          description: report.description,
          status: report.status,
          createdAt: report.createdAt,
          reporter: {
            email: reporter.email,
            firstName: reporter.profile?.firstName || null,
            lastName: reporter.profile?.lastName || null,
          },
          reported: {
            email: reported.email,
            firstName: reported.profile?.firstName || null,
            lastName: reported.profile?.lastName || null,
          },
        });
      }
    }

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Get reports error:", error);
    return { success: false, error: "Failed to fetch reports" };
  }
}

// Process report
export async function processReport(
  reportId: number,
  action: "resolved" | "dismissed",
  suspendUser?: boolean
): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const report = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
    });

    if (!report) {
      return { success: false, error: "Report not found" };
    }

    await db
      .update(reports)
      .set({
        status: action,
        resolvedAt: new Date(),
        resolvedBy: adminResult.userId,
      })
      .where(eq(reports.id, reportId));

    // Suspend reported user if requested
    if (suspendUser && action === "resolved") {
      await db.update(users).set({ isActive: false }).where(eq(users.id, report.reportedUserId));
    }

    return {
      success: true,
      message: action === "resolved" ? "Report resolved" : "Report dismissed",
    };
  } catch (error) {
    console.error("Process report error:", error);
    return { success: false, error: "Failed to process report" };
  }
}

// Get revenue analytics
export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

export async function getRevenueAnalytics(): Promise<ActionResult<RevenueData[]>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Run both analytics queries in parallel
    const [revenueByMonth, subsByMonth] = await Promise.all([
      db
        .select({
          month: sql<string>`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`,
          sum: sql<number>`COALESCE(SUM(amount), 0)`,
        })
        .from(payments)
        .where(and(eq(payments.status, "completed"), gte(payments.createdAt, twelveMonthsAgo)))
        .groupBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`),
      db
        .select({
          month: sql<string>`TO_CHAR(${subscriptions.createdAt}, 'YYYY-MM')`,
          count: count(),
        })
        .from(subscriptions)
        .where(and(ne(subscriptions.plan, "free"), gte(subscriptions.createdAt, twelveMonthsAgo)))
        .groupBy(sql`TO_CHAR(${subscriptions.createdAt}, 'YYYY-MM')`),
    ]);

    const revenueMap = new Map(revenueByMonth.map(r => [r.month, Number(r.sum)]));
    const subsMap = new Map(subsByMonth.map(s => [s.month, s.count]));

    const data: RevenueData[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      data.push({
        month: monthDate.toLocaleString("default", { month: "short", year: "2-digit" }),
        revenue: revenueMap.get(key) || 0,
        subscriptions: subsMap.get(key) || 0,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    return { success: false, error: "Failed to fetch revenue data" };
  }
}

// Get user growth analytics
export interface UserGrowthData {
  month: string;
  newUsers: number;
  totalUsers: number;
}

export async function getUserGrowthAnalytics(): Promise<ActionResult<UserGrowthData[]>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Run both queries in parallel
    const [[initialCountResult], newUsersByMonth] = await Promise.all([
      db
        .select({ count: count() })
        .from(users)
        .where(lte(users.createdAt, startDate)),
      db
        .select({
          month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
          count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`),
    ]);

    const newUsersMap = new Map(newUsersByMonth.map(r => [r.month, r.count]));

    const data: UserGrowthData[] = [];
    let runningTotal = initialCountResult.count;

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      const newUsers = newUsersMap.get(key) || 0;
      runningTotal += newUsers;

      data.push({
        month: monthDate.toLocaleString("default", { month: "short", year: "2-digit" }),
        newUsers,
        totalUsers: runningTotal,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get user growth analytics error:", error);
    return { success: false, error: "Failed to fetch user growth data" };
  }
}

// Site Settings
export async function getSiteSettings(): Promise<ActionResult<Record<string, string>>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const settings = await db.select().from(siteSettings);
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return { success: true, data: settingsMap };
  } catch (error) {
    console.error("Get site settings error:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

// Allowlist of valid site setting keys to prevent arbitrary key insertion
const ALLOWED_SETTING_KEYS = new Set([
  "siteName", "siteUrl", "supportEmail", "supportPhone",
  "maintenanceMode", "registrationEnabled", "maxPhotos",
  "termsUpdatedAt", "privacyUpdatedAt", "analyticsId",
]);

export async function updateSiteSettings(
  settings: Record<string, string>
): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const now = new Date();
    for (const [key, value] of Object.entries(settings)) {
      if (!ALLOWED_SETTING_KEYS.has(key)) {
        return { success: false, error: `Invalid setting key: ${key}` };
      }

      // Use upsert to avoid check-then-act race condition
      await db.insert(siteSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value, updatedAt: now },
        });
    }

    return { success: true, message: "Settings saved successfully" };
  } catch (error) {
    console.error("Update site settings error:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

// Contact Submissions Management
export interface AdminContactSubmission {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string | null;
  adminNotes: string | null;
  repliedAt: Date | null;
  createdAt: Date | null;
}

export async function getContactSubmissions(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<ActionResult<{ submissions: AdminContactSubmission[]; total: number }>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;

    const validContactStatuses = ["unread", "read", "replied", "archived"];
    const whereClause = status && status !== "all" && validContactStatuses.includes(status)
      ? eq(contactSubmissions.status, status)
      : undefined;

    const submissions = await db
      .select()
      .from(contactSubmissions)
      .where(whereClause)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(validatedLimit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(contactSubmissions)
      .where(whereClause);

    return {
      success: true,
      data: {
        submissions,
        total: totalResult.count,
      },
    };
  } catch (error) {
    console.error("Get contact submissions error:", error);
    return { success: false, error: "Failed to fetch contact submissions" };
  }
}

export async function updateContactStatus(
  id: number,
  status: string,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const validStatuses = ["unread", "read", "replied", "archived"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    const updateData: Record<string, unknown> = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    if (status === "replied") {
      updateData.repliedAt = new Date();
      updateData.repliedBy = adminResult.userId;
    }

    await db
      .update(contactSubmissions)
      .set(updateData)
      .where(eq(contactSubmissions.id, id));

    return { success: true, message: `Submission marked as ${status}` };
  } catch (error) {
    console.error("Update contact status error:", error);
    return { success: false, error: "Failed to update submission status" };
  }
}

export async function deleteContactSubmission(id: number): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));

    return { success: true, message: "Submission deleted" };
  } catch (error) {
    console.error("Delete contact submission error:", error);
    return { success: false, error: "Failed to delete submission" };
  }
}

// Public stats (no auth required)
export async function getPublicStats(): Promise<ActionResult<{
  totalUsers: number;
  verifiedProfiles: number;
  happyCouples: number;
}>> {
  try {
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [verifiedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.emailVerified, true));
    const [happyCouplesResult] = await db
      .select({ count: count() })
      .from(interests)
      .where(eq(interests.status, "accepted"));

    return {
      success: true,
      data: {
        totalUsers: totalUsersResult.count,
        verifiedProfiles: verifiedResult.count,
        happyCouples: happyCouplesResult.count,
      },
    };
  } catch (error) {
    console.error("Get public stats error:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

// Subscription stats for admin subscriptions page
export interface SubscriptionStats {
  totalPaid: number;
  activePaid: number;
  totalRevenue: number;
  planCounts: { plan: string | null; count: number }[];
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const [totalPaid] = await db.select({ count: count() }).from(subscriptions).where(ne(subscriptions.plan, "free"));
  const [activePaid] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.isActive, true));
  const [totalRevenue] = await db.select({ sum: sql<number>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "completed"));

  const planCounts = await db.select({
    plan: subscriptions.plan,
    count: count(),
  })
    .from(subscriptions)
    .where(ne(subscriptions.plan, "free"))
    .groupBy(subscriptions.plan);

  return {
    totalPaid: totalPaid.count,
    activePaid: activePaid.count,
    totalRevenue: Number(totalRevenue.sum) || 0,
    planCounts,
  };
}

// Recent subscriptions for admin subscriptions page
export interface RecentSubscription {
  id: number;
  userId: number;
  plan: string | null;
  isActive: boolean | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date | null;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function getRecentSubscriptionsAdmin(): Promise<RecentSubscription[]> {
  const recentSubs = await db.query.subscriptions.findMany({
    where: ne(subscriptions.plan, "free"),
    orderBy: [desc(subscriptions.createdAt)],
    limit: 50,
  });

  if (recentSubs.length === 0) return [];

  // Batch fetch all users at once
  const userIds = [...new Set(recentSubs.map(s => s.userId))];
  const usersList = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    with: { profile: true },
  });
  const userMap = new Map(usersList.map(u => [u.id, u]));

  return recentSubs
    .filter(sub => userMap.has(sub.userId))
    .map(sub => {
      const user = userMap.get(sub.userId)!;
      return {
        id: sub.id,
        userId: sub.userId,
        plan: sub.plan,
        isActive: sub.isActive,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
        user: {
          email: user.email,
          firstName: user.profile?.firstName || null,
          lastName: user.profile?.lastName || null,
        },
      };
    });
}

// Detailed analytics for admin analytics page
export interface DetailedAnalytics {
  planCounts: { name: string; value: number; color: string }[];
  interestStats: { total: number; pending: number; accepted: number; rejected: number };
  completionRanges: { range: string; count: number }[];
}

export async function getDetailedAnalytics(): Promise<DetailedAnalytics> {
  const planCounts = await db.select({
    plan: subscriptions.plan,
    count: count(),
  })
    .from(subscriptions)
    .groupBy(subscriptions.plan);

  const [totalInterests] = await db.select({ count: count() }).from(interests);
  const [pendingInterests] = await db.select({ count: count() }).from(interests).where(eq(interests.status, "pending"));
  const [acceptedInterests] = await db.select({ count: count() }).from(interests).where(eq(interests.status, "accepted"));
  const [rejectedInterests] = await db.select({ count: count() }).from(interests).where(eq(interests.status, "rejected"));

  const completionCase = sql`
    CASE
      WHEN profile_completion < 25 THEN '0-25%'
      WHEN profile_completion < 50 THEN '25-50%'
      WHEN profile_completion < 75 THEN '50-75%'
      ELSE '75-100%'
    END
  `;

  const completionRanges = await db.select({
    range: completionCase as SQL<string>,
    count: count(),
  })
    .from(profiles)
    .groupBy(completionCase);

  const planNameMap: Record<string, string> = { free: "Free", basic: "Basic", silver: "Silver", gold: "Gold", platinum: "Platinum" };
  const planColorMap: Record<string, string> = { free: "#94A3B8", basic: "#3B82F6", silver: "#6B7280", gold: "#F59E0B", platinum: "#8B5CF6" };

  return {
    planCounts: planCounts.map(p => ({
      name: planNameMap[p.plan || ""] || p.plan || "Unknown",
      value: p.count,
      color: planColorMap[p.plan || ""] || "#E2E8F0",
    })),
    interestStats: {
      total: totalInterests.count,
      pending: pendingInterests.count,
      accepted: acceptedInterests.count,
      rejected: rejectedInterests.count,
    },
    completionRanges: completionRanges.map(c => ({
      range: c.range,
      count: c.count,
    })),
  };
}
