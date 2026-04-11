"use server";

import {
  db,
  users,
  profiles,
  subscriptions,
  payments,
  interests,
  messages,
  reports,
  verifications,
  profileViews,
  siteSettings,
  contactSubmissions,
} from "@/lib/db";
import { eq, and, desc, sql, gte, lte, count, ne, inArray, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/actions/helpers";
import type { ActionResult } from "@/types";
import { calculateAge } from "@/lib/utils";

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
      db
        .select({ count: count() })
        .from(subscriptions)
        .where(and(eq(subscriptions.isActive, true), ne(subscriptions.plan, "free"))),
      db
        .select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(eq(payments.status, "completed")),
      db
        .select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(and(eq(payments.status, "completed"), gte(payments.createdAt, monthStart))),
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
    isMarried: boolean | null;
  } | null;
  subscription: {
    plan: string | null;
    isActive: boolean | null;
    endDate: Date | null;
  } | null;
}

export interface AdminUserFilters {
  status?: string;
  gender?: string;
  subscription?: string;
  trustLevel?: string;
  married?: string;
  profileCompletion?: string;
  emailVerified?: string;
  subCaste?: string;
  country?: string;
  state?: string;
  birthYearFrom?: string;
  birthYearTo?: string;
  sort?: string;
}

export interface AdminUserCsvRow {
  userId: number;
  email: string;
  emailVerified: boolean | null;
  phoneNumber: string | null;
  secondaryPhoneNumber: string | null;
  profileFor: string | null;
  role: string | null;
  createdByStaffId: number | null;
  createdByStaffEmail: string | null;
  isActive: boolean | null;
  lastActive: Date | null;
  failedLoginAttempts: number | null;
  lockedUntil: Date | null;
  userCreatedAt: Date | null;
  userUpdatedAt: Date | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  gender: string | null;
  dateOfBirth: string | Date | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  bodyType: string | null;
  complexion: string | null;
  physicalStatus: string | null;
  religion: string | null;
  caste: string | null;
  subCaste: string | null;
  motherTongue: string | null;
  gothra: string | null;
  countryLivingIn: string | null;
  residingState: string | null;
  residingCity: string | null;
  citizenship: string | null;
  highestEducation: string | null;
  educationDetail: string | null;
  employedIn: string | null;
  occupation: string | null;
  jobTitle: string | null;
  annualIncome: string | null;
  maritalStatus: string | null;
  diet: string | null;
  smoking: string | null;
  drinking: string | null;
  hobbies: string | null;
  familyStatus: string | null;
  familyType: string | null;
  familyValue: string | null;
  fatherOccupation: string | null;
  motherOccupation: string | null;
  brothers: number | null;
  brothersMarried: number | null;
  sisters: number | null;
  sistersMarried: number | null;
  aboutMe: string | null;
  profileImage: string | null;
  profileCompletion: number | null;
  trustScore: number | null;
  trustLevel: string | null;
  hideProfile: boolean | null;
  isMarried: boolean | null;
  showOnlineStatus: boolean | null;
  showLastActive: boolean | null;
  profileCreatedAt: Date | null;
  profileUpdatedAt: Date | null;
  subscriptionPlan: string | null;
  subscriptionIsActive: boolean | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  interestsPerDay: number | null;
  contactViews: number | null;
  profileBoosts: number | null;
  interestsSentToday: number | null;
  contactViewsUsed: number | null;
  boostsUsed: number | null;
  lastBoostAt: Date | null;
  boostExpiresAt: Date | null;
  subscriptionCreatedAt: Date | null;
  subscriptionUpdatedAt: Date | null;
}

function parseBirthYearFilter(value?: string): number | undefined {
  if (!value) return undefined;

  const year = Number.parseInt(value, 10);
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
    return undefined;
  }

  return year;
}

function buildAdminUserConditions(
  search?: string,
  filter?: string,
  filters?: AdminUserFilters
): SQL[] {
  const conditions: SQL[] = [];

  // Legacy single filter (backwards compatible)
  if (filter === "active") conditions.push(eq(users.isActive, true));
  else if (filter === "inactive") conditions.push(eq(users.isActive, false));

  if (filters) {
    if (filters.status === "active") conditions.push(eq(users.isActive, true));
    else if (filters.status === "inactive") conditions.push(eq(users.isActive, false));

    if (filters.emailVerified === "verified") conditions.push(eq(users.emailVerified, true));
    else if (filters.emailVerified === "unverified")
      conditions.push(eq(users.emailVerified, false));

    if (filters.gender && filters.gender !== "all")
      conditions.push(sql`${profiles.gender} = ${filters.gender}`);

    if (filters.subscription && filters.subscription !== "all") {
      if (filters.subscription === "free") {
        conditions.push(
          sql`NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = ${users.id} AND s.is_active = true AND s.plan != 'free')`
        );
      } else {
        conditions.push(
          sql`EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = ${users.id} AND s.is_active = true AND s.plan = ${filters.subscription})`
        );
      }
    }

    if (filters.trustLevel && filters.trustLevel !== "all")
      conditions.push(sql`${profiles.trustLevel} = ${filters.trustLevel}`);

    if (filters.married === "married") conditions.push(sql`${profiles.isMarried} = true`);
    else if (filters.married === "unmarried")
      conditions.push(sql`(${profiles.isMarried} = false OR ${profiles.isMarried} IS NULL)`);

    if (filters.profileCompletion) {
      if (filters.profileCompletion === "complete")
        conditions.push(sql`${profiles.profileCompletion} >= 70`);
      else if (filters.profileCompletion === "incomplete")
        conditions.push(sql`${profiles.profileCompletion} < 70`);
      else if (filters.profileCompletion === "empty")
        conditions.push(
          sql`(${profiles.profileCompletion} IS NULL OR ${profiles.profileCompletion} = 0)`
        );
    }

    if (filters.subCaste && filters.subCaste.trim()) {
      const subCasteTerm = `%${filters.subCaste.trim().toLowerCase()}%`;
      conditions.push(sql`LOWER(COALESCE(${profiles.subCaste}, '')) LIKE ${subCasteTerm}`);
    }

    if (filters.country && filters.country !== "all")
      conditions.push(sql`${profiles.countryLivingIn} = ${filters.country}`);

    if (filters.state && filters.state !== "all")
      conditions.push(sql`${profiles.residingState} = ${filters.state}`);

    const birthYearFrom = parseBirthYearFilter(filters.birthYearFrom);
    const birthYearTo = parseBirthYearFilter(filters.birthYearTo);
    const effectiveBirthYearFrom = birthYearFrom ?? birthYearTo;
    const effectiveBirthYearTo = birthYearTo ?? birthYearFrom;

    if (effectiveBirthYearFrom && effectiveBirthYearTo) {
      const startYear = Math.min(effectiveBirthYearFrom, effectiveBirthYearTo);
      const endYear = Math.max(effectiveBirthYearFrom, effectiveBirthYearTo);

      conditions.push(sql`${profiles.dateOfBirth} >= ${`${startYear}-01-01`}`);
      conditions.push(sql`${profiles.dateOfBirth} <= ${`${endYear}-12-31`}`);
    }
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(LOWER(${users.email}) LIKE ${searchTerm} OR LOWER(CONCAT(COALESCE(${profiles.firstName},''), ' ', COALESCE(${profiles.lastName},''))) LIKE ${searchTerm} OR LOWER(${users.phoneNumber}) LIKE ${searchTerm})`
    );
  }

  return conditions;
}

function getAdminUserOrderByClause(sort?: string) {
  switch (sort) {
    case "name_asc":
      return sql`${profiles.firstName} ASC NULLS LAST`;
    case "name_desc":
      return sql`${profiles.firstName} DESC NULLS LAST`;
    case "oldest":
      return sql`${users.createdAt} ASC`;
    case "last_active":
      return sql`${users.lastActive} DESC NULLS LAST`;
    case "completion_desc":
      return sql`${profiles.profileCompletion} DESC NULLS LAST`;
    case "completion_asc":
      return sql`${profiles.profileCompletion} ASC NULLS LAST`;
    default:
      return sql`${users.createdAt} DESC`;
  }
}

function hasAdminUserProfileQuery(filters?: AdminUserFilters, search?: string) {
  return Boolean(
    (filters &&
      (filters.gender ||
        filters.trustLevel ||
        filters.married ||
        filters.profileCompletion ||
        filters.subCaste ||
        filters.country ||
        filters.state ||
        filters.birthYearFrom ||
        filters.birthYearTo ||
        filters.sort)) ||
    (search && search.trim())
  );
}

async function getFilteredAdminUserIds(
  search?: string,
  filter?: string,
  filters?: AdminUserFilters
): Promise<number[]> {
  const conditions = buildAdminUserConditions(search, filter, filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const orderByClause = getAdminUserOrderByClause(filters?.sort);

  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId))
    .where(whereClause)
    .orderBy(orderByClause);

  return userRows.map((row) => row.id);
}

export async function getAdminUsers(
  page: number = 1,
  limit: number = 20,
  search?: string,
  filter?: string,
  filters?: AdminUserFilters
): Promise<ActionResult<{ users: AdminUser[]; total: number }>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;
    const conditions = buildAdminUserConditions(search, filter, filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderByClause = getAdminUserOrderByClause(filters?.sort);

    // Use join-based query when profile columns are involved in filters/search
    if (hasAdminUserProfileQuery(filters, search)) {
      const userRows = await db
        .select({
          id: users.id,
          email: users.email,
          emailVerified: users.emailVerified,
          phoneNumber: users.phoneNumber,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastActive: users.lastActive,
          profileFirstName: profiles.firstName,
          profileLastName: profiles.lastName,
          profileGender: profiles.gender,
          profileImage: profiles.profileImage,
          profileCompletion: profiles.profileCompletion,
          trustLevel: profiles.trustLevel,
          isMarried: profiles.isMarried,
        })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(validatedLimit)
        .offset(offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(users)
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(whereClause);

      // Fetch subscriptions for these users
      const userIds = userRows.map((u) => u.id);
      const subs =
        userIds.length > 0
          ? await db.query.subscriptions.findMany({
              where: and(inArray(subscriptions.userId, userIds), eq(subscriptions.isActive, true)),
            })
          : [];
      const subsByUser = new Map(subs.map((s) => [s.userId, s]));

      const formattedUsers: AdminUser[] = userRows.map((row) => ({
        id: row.id,
        email: row.email,
        emailVerified: row.emailVerified,
        phoneNumber: row.phoneNumber,
        isActive: row.isActive,
        createdAt: row.createdAt,
        lastActive: row.lastActive,
        profile:
          row.profileFirstName !== undefined
            ? {
                firstName: row.profileFirstName,
                lastName: row.profileLastName,
                gender: row.profileGender,
                profileImage: row.profileImage,
                profileCompletion: row.profileCompletion,
                trustLevel: row.trustLevel,
                isMarried: row.isMarried,
              }
            : null,
        subscription: subsByUser.has(row.id)
          ? {
              plan: subsByUser.get(row.id)!.plan,
              isActive: subsByUser.get(row.id)!.isActive,
              endDate: subsByUser.get(row.id)!.endDate,
            }
          : null,
      }));

      return {
        success: true,
        data: { users: formattedUsers, total: totalResult.count },
      };
    }

    // Simple query path (no profile filters)
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
            isMarried: user.profile.isMarried,
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

export async function getAdminUsersCsvRows(
  search?: string,
  filter?: string,
  filters?: AdminUserFilters
): Promise<ActionResult<AdminUserCsvRow[]>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const userIds = await getFilteredAdminUserIds(search, filter, filters);

    if (userIds.length === 0) {
      return { success: true, data: [] };
    }

    const usersList = await db.query.users.findMany({
      where: inArray(users.id, userIds),
      with: {
        profile: true,
      },
    });

    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: and(inArray(subscriptions.userId, userIds), eq(subscriptions.isActive, true)),
      orderBy: [desc(subscriptions.createdAt)],
    });

    const createdByStaffIds = Array.from(
      new Set(
        usersList
          .map((user) => user.createdByStaffId)
          .filter((createdByStaffId): createdByStaffId is number => createdByStaffId != null)
      )
    );

    const staffUsers =
      createdByStaffIds.length > 0
        ? await db
            .select({ id: users.id, email: users.email })
            .from(users)
            .where(inArray(users.id, createdByStaffIds))
        : [];

    const usersById = new Map(usersList.map((user) => [user.id, user]));
    const subscriptionByUserId = new Map<number, (typeof activeSubscriptions)[number]>();
    const staffEmailById = new Map(staffUsers.map((staffUser) => [staffUser.id, staffUser.email]));

    for (const subscription of activeSubscriptions) {
      if (!subscriptionByUserId.has(subscription.userId)) {
        subscriptionByUserId.set(subscription.userId, subscription);
      }
    }

    const rows: AdminUserCsvRow[] = userIds
      .map((userId) => usersById.get(userId))
      .filter((user): user is NonNullable<typeof user> => Boolean(user))
      .map((user) => {
        const profile = user.profile;
        const subscription = subscriptionByUserId.get(user.id) || null;
        const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();

        return {
          userId: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          phoneNumber: user.phoneNumber,
          secondaryPhoneNumber: user.secondaryPhoneNumber,
          profileFor: user.profileFor,
          role: user.role,
          createdByStaffId: user.createdByStaffId,
          createdByStaffEmail: user.createdByStaffId
            ? staffEmailById.get(user.createdByStaffId) || null
            : null,
          isActive: user.isActive,
          lastActive: user.lastActive,
          failedLoginAttempts: user.failedLoginAttempts,
          lockedUntil: user.lockedUntil,
          userCreatedAt: user.createdAt,
          userUpdatedAt: user.updatedAt,
          firstName: profile?.firstName ?? null,
          lastName: profile?.lastName ?? null,
          fullName: fullName || null,
          gender: profile?.gender ?? null,
          dateOfBirth: profile?.dateOfBirth ?? null,
          age: profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null,
          height: profile?.height ?? null,
          weight: profile?.weight ?? null,
          bodyType: profile?.bodyType ?? null,
          complexion: profile?.complexion ?? null,
          physicalStatus: profile?.physicalStatus ?? null,
          religion: profile?.religion ?? null,
          caste: profile?.caste ?? null,
          subCaste: profile?.subCaste ?? null,
          motherTongue: profile?.motherTongue ?? null,
          gothra: profile?.gothra ?? null,
          countryLivingIn: profile?.countryLivingIn ?? null,
          residingState: profile?.residingState ?? null,
          residingCity: profile?.residingCity ?? null,
          citizenship: profile?.citizenship ?? null,
          highestEducation: profile?.highestEducation ?? null,
          educationDetail: profile?.educationDetail ?? null,
          employedIn: profile?.employedIn ?? null,
          occupation: profile?.occupation ?? null,
          jobTitle: profile?.jobTitle ?? null,
          annualIncome: profile?.annualIncome ?? null,
          maritalStatus: profile?.maritalStatus ?? null,
          diet: profile?.diet ?? null,
          smoking: profile?.smoking ?? null,
          drinking: profile?.drinking ?? null,
          hobbies: profile?.hobbies ?? null,
          familyStatus: profile?.familyStatus ?? null,
          familyType: profile?.familyType ?? null,
          familyValue: profile?.familyValue ?? null,
          fatherOccupation: profile?.fatherOccupation ?? null,
          motherOccupation: profile?.motherOccupation ?? null,
          brothers: profile?.brothers ?? null,
          brothersMarried: profile?.brothersMarried ?? null,
          sisters: profile?.sisters ?? null,
          sistersMarried: profile?.sistersMarried ?? null,
          aboutMe: profile?.aboutMe ?? null,
          profileImage: profile?.profileImage ?? null,
          profileCompletion: profile?.profileCompletion ?? null,
          trustScore: profile?.trustScore ?? null,
          trustLevel: profile?.trustLevel ?? null,
          hideProfile: profile?.hideProfile ?? null,
          isMarried: profile?.isMarried ?? null,
          showOnlineStatus: profile?.showOnlineStatus ?? null,
          showLastActive: profile?.showLastActive ?? null,
          profileCreatedAt: profile?.createdAt ?? null,
          profileUpdatedAt: profile?.updatedAt ?? null,
          subscriptionPlan: subscription?.plan ?? null,
          subscriptionIsActive: subscription?.isActive ?? null,
          subscriptionStartDate: subscription?.startDate ?? null,
          subscriptionEndDate: subscription?.endDate ?? null,
          interestsPerDay: subscription?.interestsPerDay ?? null,
          contactViews: subscription?.contactViews ?? null,
          profileBoosts: subscription?.profileBoosts ?? null,
          interestsSentToday: subscription?.interestsSentToday ?? null,
          contactViewsUsed: subscription?.contactViewsUsed ?? null,
          boostsUsed: subscription?.boostsUsed ?? null,
          lastBoostAt: subscription?.lastBoostAt ?? null,
          boostExpiresAt: subscription?.boostExpiresAt ?? null,
          subscriptionCreatedAt: subscription?.createdAt ?? null,
          subscriptionUpdatedAt: subscription?.updatedAt ?? null,
        };
      });

    return { success: true, data: rows };
  } catch (error) {
    console.error("Get admin users CSV rows error:", error);
    return { success: false, error: "Failed to export users" };
  }
}

export async function getAdminUserDetails(userId: number): Promise<
  ActionResult<
    AdminUser & {
      interestsSent: number;
      interestsReceived: number;
      profileViews: number;
      messagesCount: number;
      createdByStaffEmail?: string;
    }
  >
> {
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

    let createdByStaffEmail: string | undefined;
    if (user.createdByStaffId) {
      const staffUser = await db.query.users.findFirst({
        where: eq(users.id, user.createdByStaffId),
        columns: { email: true },
      });
      createdByStaffEmail = staffUser?.email;
    }

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
              isMarried: user.profile.isMarried,
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
        createdByStaffEmail,
      },
    };
  } catch (error) {
    console.error("Get user details error:", error);
    return { success: false, error: "Failed to fetch user details" };
  }
}

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

export async function verifyUserProfile(
  userId: number,
  trustLevel: "new_member" | "verified_user" | "highly_trusted"
): Promise<ActionResult> {
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

export async function adminToggleMarriedStatus(
  userId: number,
  isMarried: boolean
): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    await db
      .update(profiles)
      .set({
        isMarried,
        hideProfile: isMarried ? true : false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    return {
      success: true,
      message: isMarried ? "User marked as married" : "User unmarried status restored",
    };
  } catch (error) {
    console.error("Toggle married status error:", error);
    return { success: false, error: "Failed to update married status" };
  }
}

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
      limit: 100,
    });

    if (pending.length === 0) {
      return { success: true, data: [] };
    }

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

export async function processVerification(
  verificationId: number,
  status: "verified" | "rejected",
  rejectionReason?: string
): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

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

    const validatedStatus =
      status && VALID_REPORT_STATUSES.includes(status as (typeof VALID_REPORT_STATUSES)[number])
        ? status
        : undefined;

    const reportsList = await db.query.reports.findMany({
      where: validatedStatus ? eq(reports.status, validatedStatus) : undefined,
      orderBy: [desc(reports.createdAt)],
      limit: 100,
    });

    if (reportsList.length === 0) {
      return { success: true, data: [] };
    }

    const userIds = new Set<number>();
    reportsList.forEach((report) => {
      userIds.add(report.reporterId);
      userIds.add(report.reportedUserId);
    });

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

    const revenueMap = new Map(revenueByMonth.map((r) => [r.month, Number(r.sum)]));
    const subsMap = new Map(subsByMonth.map((s) => [s.month, s.count]));

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

    const [[initialCountResult], newUsersByMonth] = await Promise.all([
      db.select({ count: count() }).from(users).where(lte(users.createdAt, startDate)),
      db
        .select({
          month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
          count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`),
    ]);

    const newUsersMap = new Map(newUsersByMonth.map((r) => [r.month, r.count]));

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

const ALLOWED_SETTING_KEYS = new Set([
  "siteName",
  "siteUrl",
  "supportEmail",
  "supportPhone",
  "address",
  "workingHours",
  "maintenanceMode",
  "registrationEnabled",
  "maxPhotos",
  "termsUpdatedAt",
  "privacyUpdatedAt",
  "analyticsId",
  "fromEmail",
  "fromName",
  "welcomeEmail",
  "interestNotifications",
  "messageNotifications",
  "subscriptionReminders",
  "notificationEmail",
  "adminNewRegistration",
  "adminNewReport",
  "adminNewPayment",
  "adminVerificationRequest",
  "twoFactorAuth",
  "emailVerificationRequired",
  "profileModeration",
  "sessionTimeout",
  "maxLoginAttempts",
]);

export async function updateSiteSettings(settings: Record<string, string>): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const now = new Date();
    for (const [key, value] of Object.entries(settings)) {
      if (!ALLOWED_SETTING_KEYS.has(key)) {
        return { success: false, error: `Invalid setting key: ${key}` };
      }

      await db
        .insert(siteSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value, updatedAt: now },
        });
    }

    // Revalidate all pages so updated settings (footer, contact info, etc.) take effect
    revalidatePath("/", "layout");

    return { success: true, message: "Settings saved successfully" };
  } catch (error) {
    console.error("Update site settings error:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

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
    const whereClause =
      status && status !== "all" && validContactStatuses.includes(status)
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

    await db.update(contactSubmissions).set(updateData).where(eq(contactSubmissions.id, id));

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

export async function getPublicStats(): Promise<
  ActionResult<{
    totalUsers: number;
    verifiedProfiles: number;
    happyCouples: number;
  }>
> {
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

export interface SubscriptionStats {
  totalPaid: number;
  activePaid: number;
  totalRevenue: number;
  planCounts: { plan: string | null; count: number }[];
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const [totalPaid] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(ne(subscriptions.plan, "free"));
  const [activePaid] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.isActive, true));
  const [totalRevenue] = await db
    .select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "completed"));

  const planCounts = await db
    .select({
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

  const userIds = [...new Set(recentSubs.map((s) => s.userId))];
  const usersList = await db.query.users.findMany({
    where: inArray(users.id, userIds),
    with: { profile: true },
  });
  const userMap = new Map(usersList.map((u) => [u.id, u]));

  return recentSubs
    .filter((sub) => userMap.has(sub.userId))
    .map((sub) => {
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

export interface DetailedAnalytics {
  planCounts: { name: string; value: number; color: string }[];
  interestStats: { total: number; pending: number; accepted: number; rejected: number };
  completionRanges: { range: string; count: number }[];
}

export async function getDetailedAnalytics(): Promise<DetailedAnalytics> {
  const planCounts = await db
    .select({
      plan: subscriptions.plan,
      count: count(),
    })
    .from(subscriptions)
    .groupBy(subscriptions.plan);

  const [totalInterests] = await db.select({ count: count() }).from(interests);
  const [pendingInterests] = await db
    .select({ count: count() })
    .from(interests)
    .where(eq(interests.status, "pending"));
  const [acceptedInterests] = await db
    .select({ count: count() })
    .from(interests)
    .where(eq(interests.status, "accepted"));
  const [rejectedInterests] = await db
    .select({ count: count() })
    .from(interests)
    .where(eq(interests.status, "rejected"));

  const completionCase = sql`
    CASE
      WHEN profile_completion < 25 THEN '0-25%'
      WHEN profile_completion < 50 THEN '25-50%'
      WHEN profile_completion < 75 THEN '50-75%'
      ELSE '75-100%'
    END
  `;

  const completionRanges = await db
    .select({
      range: completionCase as SQL<string>,
      count: count(),
    })
    .from(profiles)
    .groupBy(completionCase);

  const planNameMap: Record<string, string> = {
    free: "Free",
    basic: "Basic",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
  };
  const planColorMap: Record<string, string> = {
    free: "#94A3B8",
    basic: "#3B82F6",
    silver: "#6B7280",
    gold: "#F59E0B",
    platinum: "#8B5CF6",
  };

  return {
    planCounts: planCounts.map((p) => ({
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
    completionRanges: completionRanges.map((c) => ({
      range: c.range,
      count: c.count,
    })),
  };
}

export interface AdminCreateUserInput {
  email: string;
  password: string;
  profileFor: "myself" | "son" | "daughter" | "brother" | "sister" | "friend";
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export async function adminCreateUser(data: AdminCreateUserInput): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const email = data.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address" };
    }

    if (!data.password || data.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          profileFor: data.profileFor,
          phoneNumber: data.phoneNumber?.trim() || null,
          emailVerified: true, // Admin-created accounts are pre-verified
          isActive: true,
        })
        .returning({ id: users.id });

      await tx.insert(profiles).values({
        userId: user.id,
        firstName: data.firstName?.trim() || null,
        lastName: data.lastName?.trim() || null,
      });

      await tx.insert(subscriptions).values({
        userId: user.id,
        plan: "free",
        isActive: true,
        interestsPerDay: 5,
        contactViews: 0,
        profileBoosts: 0,
      });
    });

    return {
      success: true,
      message: `User account created successfully for ${email}`,
    };
  } catch (error) {
    console.error("Admin create user error:", error);
    return { success: false, error: "Failed to create user account" };
  }
}

// ── Staff Management ───────────────────────────────────────────────

export interface AdminStaff {
  id: number;
  email: string;
  name: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  createdProfilesCount: number;
}

export async function adminCreateStaff(data: {
  email: string;
  password: string;
  name: string;
}): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const email = data.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address" };
    }

    if (!data.password || data.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" };
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role: "staff",
          emailVerified: true,
          isActive: true,
        })
        .returning({ id: users.id });

      // Create a basic profile with just the name
      await tx.insert(profiles).values({
        userId: user.id,
        firstName: data.name.trim(),
      });
    });

    return {
      success: true,
      message: `Staff account created successfully for ${email}`,
    };
  } catch (error) {
    console.error("Admin create staff error:", error);
    return { success: false, error: "Failed to create staff account" };
  }
}

export async function adminGetStaffList(): Promise<ActionResult<AdminStaff[]>> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const staffUsers = await db.query.users.findMany({
      where: eq(users.role, "staff"),
      with: { profile: true },
      orderBy: [desc(users.createdAt)],
    });

    if (staffUsers.length === 0) {
      return { success: true, data: [] };
    }

    const staffIds = staffUsers.map((s) => s.id);
    const countResults = await db
      .select({
        staffId: users.createdByStaffId,
        count: count(),
      })
      .from(users)
      .where(inArray(users.createdByStaffId, staffIds))
      .groupBy(users.createdByStaffId);

    const countMap = new Map(countResults.map((r) => [r.staffId, r.count]));

    const formatted: AdminStaff[] = staffUsers.map((s) => ({
      id: s.id,
      email: s.email,
      name: s.profile?.firstName || null,
      isActive: s.isActive,
      createdAt: s.createdAt,
      createdProfilesCount: countMap.get(s.id) || 0,
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Admin get staff list error:", error);
    return { success: false, error: "Failed to fetch staff list" };
  }
}

export async function adminToggleStaffStatus(userId: number): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const user = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.role, "staff")),
    });

    if (!user) {
      return { success: false, error: "Staff account not found" };
    }

    const newStatus = !user.isActive;
    await db.update(users).set({ isActive: newStatus }).where(eq(users.id, userId));

    return {
      success: true,
      message: newStatus ? "Staff account activated" : "Staff account deactivated",
    };
  } catch (error) {
    console.error("Admin toggle staff status error:", error);
    return { success: false, error: "Failed to update staff status" };
  }
}

export async function adminDeleteStaff(userId: number): Promise<ActionResult> {
  try {
    const adminResult = await requireAdmin();
    if (adminResult.error) return adminResult.error;

    const user = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.role, "staff")),
    });

    if (!user) {
      return { success: false, error: "Staff account not found" };
    }

    // Set createdByStaffId to null for profiles this staff created
    await db
      .update(users)
      .set({ createdByStaffId: null })
      .where(eq(users.createdByStaffId, userId));

    // Delete the staff user (cascades to profile)
    await db.delete(users).where(eq(users.id, userId));

    return { success: true, message: "Staff account deleted" };
  } catch (error) {
    console.error("Admin delete staff error:", error);
    return { success: false, error: "Failed to delete staff account" };
  }
}
