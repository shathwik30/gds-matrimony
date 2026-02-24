"use server";

import { db, profiles, profileImages, partnerPreferences, interests, blocks, users, subscriptions } from "@/lib/db";
import { eq, and, ne, or, inArray, sql, gte, notInArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function extractFileKey(url: string): string | null {
  try {
    const parts = url.split("/f/");
    return parts.length > 1 ? parts[1].split("?")[0] : null;
  } catch {
    return null;
  }
}
import { calculateAge, calculateProfileCompletion } from "@/lib/utils";
import { calculateCompatibilityScore } from "@/lib/utils/compatibility";
import { getActiveSubscription } from "@/lib/actions/subscription";
import { requireAuth } from "@/lib/actions/helpers";
import type { ProfileInput, PartnerPreferencesInput } from "@/lib/validations/profile";
import type { ActionResult, MatchProfile, SearchFilters } from "@/types";

// Get current user's profile
export async function getMyProfile(): Promise<ActionResult<typeof profiles.$inferSelect>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
        },
        user: {
          columns: { phoneNumber: true, secondaryPhoneNumber: true },
        },
      },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Merge phone fields from users table into the profile data
    const profileWithPhone = {
      ...profile,
      phoneNumber: profile.user?.phoneNumber ?? null,
      secondaryPhoneNumber: profile.user?.secondaryPhoneNumber ?? null,
    };

    return { success: true, data: profileWithPhone };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

// Update profile
export async function updateProfile(data: Partial<ProfileInput>): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Get current profile
    const currentProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!currentProfile) {
      return { success: false, error: "Profile not found" };
    }

    // Allowlist of permitted profile fields (excludes phone — stored in users table)
    const ALLOWED_PROFILE_FIELDS = new Set([
      "firstName", "lastName", "gender", "dateOfBirth", "height", "weight",
      "bodyType", "complexion", "physicalStatus", "religion", "caste", "subCaste",
      "motherTongue", "gothra", "countryLivingIn", "residingState", "residingCity",
      "citizenship", "highestEducation", "educationDetail", "employedIn",
      "occupation", "jobTitle", "annualIncome", "maritalStatus", "diet",
      "smoking", "drinking", "hobbies", "familyStatus", "familyType",
      "familyValue", "fatherOccupation", "motherOccupation", "brothers",
      "brothersMarried", "sisters", "sistersMarried", "aboutMe", "profileImage",
      "hideProfile", "showOnlineStatus", "showLastActive",
    ]);

    // Phone fields go to the users table
    const { dateOfBirth, phoneNumber, secondaryPhoneNumber, ...restData } = data as Record<string, unknown> & { dateOfBirth?: Date; phoneNumber?: string; secondaryPhoneNumber?: string };

    // Save phone numbers to users table if provided
    if (phoneNumber !== undefined || secondaryPhoneNumber !== undefined) {
      const userUpdate: Record<string, unknown> = { updatedAt: new Date() };
      if (phoneNumber !== undefined) userUpdate.phoneNumber = phoneNumber || null;
      if (secondaryPhoneNumber !== undefined) userUpdate.secondaryPhoneNumber = secondaryPhoneNumber || null;
      await db.update(users).set(userUpdate).where(eq(users.id, userId));
    }

    // Filter input to only allowed profile fields
    const sanitizedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(restData)) {
      if (ALLOWED_PROFILE_FIELDS.has(key)) {
        sanitizedData[key] = value;
      }
    }
    const updateData: Record<string, unknown> = {
      ...sanitizedData,
      updatedAt: new Date(),
    };

    // Convert Date to string for dateOfBirth if provided
    if (dateOfBirth) {
      updateData.dateOfBirth = (dateOfBirth as Date).toISOString().split("T")[0];
    }

    // Calculate profile completion (include phone in the merged check)
    const mergedProfile = { ...currentProfile, ...updateData, phoneNumber };
    const profileCompletion = calculateProfileCompletion(mergedProfile as Record<string, unknown>);
    updateData.profileCompletion = profileCompletion;

    await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, userId));

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// Update profile image
export async function updateProfileImage(imageUrl: string): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Fetch old image URL before overwriting
    const current = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
      columns: { profileImage: true },
    });

    await db
      .update(profiles)
      .set({ profileImage: imageUrl, updatedAt: new Date() })
      .where(eq(profiles.userId, userId));

    // Delete old image from UploadThing (non-blocking)
    if (current?.profileImage) {
      const key = extractFileKey(current.profileImage);
      if (key) utapi.deleteFiles([key]).catch(() => {});
    }

    return { success: true, message: "Profile image updated" };
  } catch (error) {
    console.error("Update profile image error:", error);
    return { success: false, error: "Failed to update profile image" };
  }
}

// Add gallery image
export async function addGalleryImage(imageUrl: string): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Use transaction to prevent race condition between count check and insert
    const result = await db.transaction(async (tx) => {
      const existingImages = await tx.query.profileImages.findMany({
        where: eq(profileImages.profileId, profile.id),
      });

      if (existingImages.length >= 5) {
        return { limitReached: true as const };
      }

      const [inserted] = await tx.insert(profileImages).values({
        profileId: profile.id,
        imageUrl,
        sortOrder: existingImages.length,
      }).returning({ id: profileImages.id });

      return { limitReached: false as const, id: inserted.id };
    });

    if (result.limitReached) {
      return { success: false, error: "Maximum 5 images allowed" };
    }

    return { success: true, message: "Image added successfully", data: { id: result.id } };
  } catch (error) {
    console.error("Add gallery image error:", error);
    return { success: false, error: "Failed to add image" };
  }
}

// Delete gallery image
export async function deleteGalleryImage(imageId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Fetch the image URL before deleting so we can clean up UploadThing
    const image = await db.query.profileImages.findFirst({
      where: and(
        eq(profileImages.id, imageId),
        eq(profileImages.profileId, profile.id)
      ),
      columns: { imageUrl: true },
    });

    await db
      .delete(profileImages)
      .where(
        and(
          eq(profileImages.id, imageId),
          eq(profileImages.profileId, profile.id)
        )
      );

    // Delete from UploadThing (non-blocking)
    if (image?.imageUrl) {
      const key = extractFileKey(image.imageUrl);
      if (key) utapi.deleteFiles([key]).catch(() => {});
    }

    return { success: true, message: "Image deleted successfully" };
  } catch (error) {
    console.error("Delete gallery image error:", error);
    return { success: false, error: "Failed to delete image" };
  }
}

// Reorder gallery images
export async function reorderGalleryImages(
  orderedItems: { id: number; sortOrder: number }[]
): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    await Promise.all(
      orderedItems.map(({ id, sortOrder }) =>
        db
          .update(profileImages)
          .set({ sortOrder })
          .where(
            and(
              eq(profileImages.id, id),
              eq(profileImages.profileId, profile.id)
            )
          )
      )
    );

    return { success: true, message: "Image order updated" };
  } catch (error) {
    console.error("Reorder gallery images error:", error);
    return { success: false, error: "Failed to reorder images" };
  }
}

// Get partner preferences
export async function getPartnerPreferences(): Promise<ActionResult<typeof partnerPreferences.$inferSelect>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const preferences = await db.query.partnerPreferences.findFirst({
      where: eq(partnerPreferences.userId, userId),
    });

    return { success: true, data: preferences || undefined };
  } catch (error) {
    console.error("Get preferences error:", error);
    return { success: false, error: "Failed to fetch preferences" };
  }
}

// Update partner preferences
export async function updatePartnerPreferences(
  data: PartnerPreferencesInput
): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const existing = await db.query.partnerPreferences.findFirst({
      where: eq(partnerPreferences.userId, userId),
    });

    const preferencesData = {
      ...data,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(partnerPreferences)
        .set(preferencesData)
        .where(eq(partnerPreferences.userId, userId));
    } else {
      await db.insert(partnerPreferences).values({
        userId,
        ...preferencesData,
      });
    }

    return { success: true, message: "Preferences updated successfully" };
  } catch (error) {
    console.error("Update preferences error:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}

// Get notification preferences
export async function getNotificationPrefs(): Promise<ActionResult<{
  email: boolean;
  interests: boolean;
  messages: boolean;
  matches: boolean;
}>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
      columns: { notificationPrefs: true },
    });

    const defaults = { email: true, interests: true, messages: true, matches: true };
    return {
      success: true,
      data: (profile?.notificationPrefs as typeof defaults) || defaults,
    };
  } catch (error) {
    console.error("Get notification prefs error:", error);
    return { success: false, error: "Failed to fetch notification preferences" };
  }
}

// Save notification preferences
export async function saveNotificationPrefs(prefs: {
  email: boolean;
  interests: boolean;
  messages: boolean;
  matches: boolean;
}): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    await db
      .update(profiles)
      .set({ notificationPrefs: prefs, updatedAt: new Date() })
      .where(eq(profiles.userId, userId));

    return { success: true, message: "Notification preferences saved" };
  } catch (error) {
    console.error("Save notification prefs error:", error);
    return { success: false, error: "Failed to save notification preferences" };
  }
}

// Get matching profiles with SQL-level pagination and deterministic random ordering
export async function getMatchingProfiles(
  filters?: SearchFilters,
  page: number = 1,
  limit: number = 20,
  seed?: string,
  excludeUserIds?: number[]
): Promise<ActionResult<{ profiles: MatchProfile[]; total: number; seed: string }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    // Use provided seed or generate one for consistent pagination across pages
    const orderSeed = seed || String(Date.now());

    // Get current user's profile and partner preferences in parallel
    const [myProfile, myPreferences] = await Promise.all([
      db.query.profiles.findFirst({
        where: eq(profiles.userId, userId),
      }),
      db.query.partnerPreferences.findFirst({
        where: eq(partnerPreferences.userId, userId),
      }),
    ]);

    if (!myProfile) {
      return { success: false, error: "Please complete your profile first" };
    }

    if (!myProfile.gender) {
      return { success: false, error: "Please set your gender in profile settings" };
    }

    const targetGender = myProfile.gender === "male" ? "female" : "male";

    // Get blocked user IDs (both directions)
    const blockedRows = await db
      .select({ blockerId: blocks.blockerId, blockedUserId: blocks.blockedUserId })
      .from(blocks)
      .where(or(eq(blocks.blockerId, userId), eq(blocks.blockedUserId, userId)));

    const blockedUserIds = new Set<number>();
    for (const row of blockedRows) {
      if (row.blockerId === userId) blockedUserIds.add(row.blockedUserId);
      else blockedUserIds.add(row.blockerId);
    }

    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [
      ne(profiles.userId, userId),
      eq(profiles.gender, targetGender),
      eq(profiles.hideProfile, false),
      sql`${profiles.dateOfBirth} IS NOT NULL`,
    ];

    if (blockedUserIds.size > 0) {
      conditions.push(notInArray(profiles.userId, [...blockedUserIds]));
    }

    if (excludeUserIds && excludeUserIds.length > 0) {
      conditions.push(notInArray(profiles.userId, excludeUserIds.slice(0, 500)));
    }

    // Apply user search filters
    if (filters?.ageMin) {
      const v = Math.max(18, Math.min(100, Math.floor(Number(filters.ageMin))));
      conditions.push(sql`${profiles.dateOfBirth} <= CURRENT_DATE - make_interval(years => ${v})`);
    }
    if (filters?.ageMax) {
      const v = Math.max(18, Math.min(100, Math.floor(Number(filters.ageMax)))) + 1;
      conditions.push(sql`${profiles.dateOfBirth} >= CURRENT_DATE - make_interval(years => ${v}) + INTERVAL '1 day'`);
    }
    if (filters?.heightMin) conditions.push(gte(profiles.height, filters.heightMin));
    if (filters?.heightMax) conditions.push(sql`${profiles.height} <= ${filters.heightMax}`);

    // Case-insensitive filter matching — DB has mixed casing (seed=TitleCase, form=lowercase)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ciIn = (col: any, values: string[]) =>
      inArray(sql`lower(${col})`, values.map((v) => v.toLowerCase()));

    if (filters?.religion?.length) conditions.push(ciIn(profiles.religion, filters.religion));
    if (filters?.caste?.length) conditions.push(ciIn(profiles.caste, filters.caste));
    if (filters?.motherTongue?.length) conditions.push(ciIn(profiles.motherTongue, filters.motherTongue));
    if (filters?.education?.length) conditions.push(ciIn(profiles.highestEducation, filters.education));
    if (filters?.profession?.length) conditions.push(ciIn(profiles.occupation, filters.profession));
    if (filters?.diet?.length) conditions.push(ciIn(profiles.diet, filters.diet));
    if (filters?.state?.length) conditions.push(inArray(profiles.residingState, filters.state));
    if (filters?.city?.length) conditions.push(inArray(profiles.residingCity, filters.city));
    if (filters?.maritalStatus?.length) {
      conditions.push(inArray(profiles.maritalStatus, filters.maritalStatus as ("never_married" | "divorced" | "widowed" | "awaiting_divorce")[]));
    }
    if (filters?.physicalStatus) conditions.push(eq(profiles.physicalStatus, filters.physicalStatus));
    if (filters?.income?.length) conditions.push(inArray(profiles.annualIncome, filters.income));

    const whereClause = and(...conditions);

    // Subquery: check if a user has an active profile boost
    // A boost is active when subscriptions.boostExpiresAt > NOW()
    const boostSubquery = sql`(
      SELECT 1 FROM "subscriptions"
      WHERE "subscriptions"."user_id" = ${profiles.userId}
        AND "subscriptions"."is_active" = true
        AND "subscriptions"."boost_expires_at" > NOW()
      LIMIT 1
    )`;

    // Run count and paginated data queries in parallel
    const [countResult, pageProfiles] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(profiles)
        .where(whereClause),
      db.query.profiles.findMany({
        where: whereClause,
        with: {
          user: {
            columns: { id: true, lastActive: true, isActive: true },
          },
        },
        // Order: boosted profiles first, then deterministic pseudo-random via md5
        orderBy: [
          sql`(CASE WHEN ${boostSubquery} IS NOT NULL THEN 0 ELSE 1 END)`,
          sql`md5(cast(${profiles.userId} as text) || ${orderSeed})`,
        ],
        limit: safeLimit,
        offset,
      }),
    ]);

    const total = countResult[0]?.count ?? 0;

    // Fetch active boost status for the profiles on this page so we can
    // apply the 15% match-score multiplier for boosted profiles.
    const pageUserIds = pageProfiles.map((p) => p.userId);
    const boostedUserIds = new Set<number>();
    if (pageUserIds.length > 0) {
      const boostRows = await db
        .select({ userId: subscriptions.userId })
        .from(subscriptions)
        .where(
          and(
            inArray(subscriptions.userId, pageUserIds),
            eq(subscriptions.isActive, true),
            sql`${subscriptions.boostExpiresAt} > NOW()`
          )
        );
      for (const row of boostRows) {
        boostedUserIds.add(row.userId);
      }
    }

    // Format results — boosted profiles get a 15% match-score visibility increase
    const BOOST_MULTIPLIER = 1.15;
    const result: MatchProfile[] = pageProfiles.map((p) => {
      const age = calculateAge(p.dateOfBirth!);
      const baseScore = calculateCompatibilityScore(myPreferences ?? null, p);
      const isBoosted = boostedUserIds.has(p.userId);
      const matchScore = isBoosted
        ? Math.min(100, Math.round(baseScore * BOOST_MULTIPLIER))
        : baseScore;
      return {
        id: p.id,
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        age,
        height: p.height,
        religion: p.religion,
        caste: p.caste,
        motherTongue: p.motherTongue,
        residingCity: p.residingCity,
        residingState: p.residingState,
        highestEducation: p.highestEducation,
        occupation: p.occupation,
        annualIncome: p.annualIncome,
        profileImage: p.profileImage,
        aboutMe: p.aboutMe,
        profileCompletion: p.profileCompletion || 0,
        trustLevel: p.trustLevel,
        matchScore,
        isBoosted: isBoosted || undefined,
        lastActive: p.user?.lastActive || undefined,
        showLastActive: p.showLastActive ?? undefined,
        showOnlineStatus: p.showOnlineStatus ?? undefined,
      };
    });

    return { success: true, data: { profiles: result, total, seed: orderSeed } };
  } catch (error) {
    console.error("Get matching profiles error:", error);
    return { success: false, error: "Failed to fetch profiles" };
  }
}

// Get profile by ID
export async function getProfileById(
  profileUserId: number
): Promise<ActionResult<MatchProfile>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const [profile, viewerPreferences] = await Promise.all([
      db.query.profiles.findFirst({
        where: eq(profiles.userId, profileUserId),
        with: {
          user: {
            columns: {
              id: true,
              lastActive: true,
              isActive: true,
              email: true,
              phoneNumber: true,
            },
          },
          images: {
            orderBy: (images, { asc }) => [asc(images.sortOrder)],
          },
        },
      }),
      userId !== profileUserId
        ? db.query.partnerPreferences.findFirst({
            where: eq(partnerPreferences.userId, userId),
          })
        : Promise.resolve(null),
    ]);

    if (!profile || profile.hideProfile) {
      return { success: false, error: "Profile not found" };
    }

    // Check if either user has blocked the other
    if (userId !== profileUserId) {
      const blockExists = await db.query.blocks.findFirst({
        where: or(
          and(eq(blocks.blockerId, userId), eq(blocks.blockedUserId, profileUserId)),
          and(eq(blocks.blockerId, profileUserId), eq(blocks.blockedUserId, userId))
        ),
      });
      if (blockExists) {
        return { success: false, error: "Profile not found" };
      }
    }

    const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 0;

    // Check if current user has premium subscription and accepted interest
    let canViewContact = false;
    let canViewPhoto = true; // own profile always unblurred
    if (userId !== profileUserId) {
      const [activeSub, acceptedInterest] = await Promise.all([
        getActiveSubscription(userId),
        db.query.interests.findFirst({
          where: and(
            or(
              and(eq(interests.senderId, userId), eq(interests.receiverId, profileUserId)),
              and(eq(interests.senderId, profileUserId), eq(interests.receiverId, userId))
            ),
            eq(interests.status, "accepted")
          ),
        }),
      ]);

      const plan = activeSub?.plan || "free";
      canViewContact = plan !== "free" && !!acceptedInterest;
      // Photos: free users see blurred, any paid plan sees unblurred
      canViewPhoto = plan !== "free";
    }

    const formattedProfile: MatchProfile = {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      age,
      height: profile.height,
      religion: profile.religion,
      caste: profile.caste,
      motherTongue: profile.motherTongue,
      residingCity: profile.residingCity,
      residingState: profile.residingState,
      highestEducation: profile.highestEducation,
      occupation: profile.occupation,
      annualIncome: profile.annualIncome,
      profileImage: profile.profileImage,
      aboutMe: profile.aboutMe,
      profileCompletion: profile.profileCompletion || 0,
      trustLevel: profile.trustLevel,
      matchScore: userId !== profileUserId
        ? calculateCompatibilityScore(viewerPreferences ?? null, profile)
        : 0,
      lastActive: profile.user?.lastActive || undefined,
      email: canViewContact ? profile.user?.email : undefined,
      phoneNumber: canViewContact ? profile.user?.phoneNumber || undefined : undefined,
      canViewPhoto,
      images: profile.images?.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder,
      })) ?? [],
    };

    return { success: true, data: formattedProfile };
  } catch (error) {
    console.error("Get profile by ID error:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

// Get recommended matches for dashboard (excludes profiles with existing interactions)
export async function getRecommendedMatches(limit: number = 5): Promise<ActionResult<MatchProfile[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Get all user IDs that the user has already interacted with
    const interactionRows = await db.query.interests.findMany({
      where: or(
        eq(interests.senderId, userId),
        eq(interests.receiverId, userId)
      ),
      columns: { senderId: true, receiverId: true },
    });

    // Create a set of user IDs to exclude
    const excludeIds = new Set<number>();
    for (const row of interactionRows) {
      if (row.senderId !== userId) excludeIds.add(row.senderId);
      if (row.receiverId !== userId) excludeIds.add(row.receiverId);
    }
    excludeIds.add(userId); // Also exclude self

    // Use getMatchingProfiles with exclusions at DB level
    const result = await getMatchingProfiles(
      undefined, // no filters
      1,
      limit,
      undefined,
      [...excludeIds]
    );

    if (!result.success || !result.data) {
      return { success: false, error: "Failed to get recommendations" };
    }

    return { success: true, data: result.data.profiles };
  } catch (error) {
    console.error("Get recommended matches error:", error);
    return { success: false, error: "Failed to get recommendations" };
  }
}
