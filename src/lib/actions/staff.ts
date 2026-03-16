"use server";

import { db, users, profiles, subscriptions, profileImages } from "@/lib/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireStaff } from "@/lib/actions/helpers";
import { calculateProfileCompletion } from "@/lib/utils";
import type { ActionResult } from "@/types";

export interface StaffCreateProfileInput {
  // Account
  email: string;
  password: string;
  profileFor: "myself" | "son" | "daughter" | "brother" | "sister" | "friend";

  // Basic info
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  dateOfBirth: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;

  // Physical
  height: number;
  weight?: number;
  bodyType?: string;
  complexion?: string;
  physicalStatus?: string;

  // Religion & location
  religion: string;
  caste?: string;
  subCaste?: string;
  motherTongue: string;
  gothra?: string;
  countryLivingIn: string;
  residingState: string;
  residingCity: string;
  citizenship?: string;

  // Education & career
  highestEducation: string;
  educationDetail?: string;
  employedIn?: string;
  occupation?: string;
  jobTitle?: string;
  annualIncome?: string;

  // Lifestyle
  maritalStatus: "never_married" | "divorced" | "widowed" | "awaiting_divorce";
  diet?: string;
  smoking?: string;
  drinking?: string;
  hobbies?: string;

  // Family
  familyStatus?: string;
  familyType?: string;
  familyValue?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  brothers?: number;
  brothersMarried?: number;
  sisters?: number;
  sistersMarried?: number;

  // About
  aboutMe: string;

  // Photos
  profileImage?: string;
  galleryImages?: string[];
}

export interface StaffCreatedUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  profileCompletion: number | null;
  createdAt: Date | null;
}

export async function staffCreateProfile(
  data: StaffCreateProfileInput
): Promise<ActionResult<{ userId: number; email: string }>> {
  try {
    const staffResult = await requireStaff();
    if (staffResult.error) return staffResult.error;

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

    const profileData = {
      firstName: data.firstName?.trim() || null,
      lastName: data.lastName?.trim() || null,
      gender: data.gender as "male" | "female",
      dateOfBirth: data.dateOfBirth,
      height: data.height,
      weight: data.weight ?? null,
      bodyType: data.bodyType ?? null,
      complexion: data.complexion ?? null,
      physicalStatus: data.physicalStatus ?? null,
      religion: data.religion ?? null,
      caste: data.caste ?? null,
      subCaste: data.subCaste ?? null,
      motherTongue: data.motherTongue ?? null,
      gothra: data.gothra ?? null,
      countryLivingIn: data.countryLivingIn ?? null,
      residingState: data.residingState ?? null,
      residingCity: data.residingCity ?? null,
      citizenship: data.citizenship ?? null,
      highestEducation: data.highestEducation ?? null,
      educationDetail: data.educationDetail ?? null,
      employedIn: data.employedIn ?? null,
      occupation: data.occupation ?? null,
      jobTitle: data.jobTitle ?? null,
      annualIncome: data.annualIncome ?? null,
      maritalStatus: data.maritalStatus,
      diet: data.diet ?? null,
      smoking: data.smoking ?? null,
      drinking: data.drinking ?? null,
      hobbies: data.hobbies ?? null,
      familyStatus: data.familyStatus ?? null,
      familyType: data.familyType ?? null,
      familyValue: data.familyValue ?? null,
      fatherOccupation: data.fatherOccupation ?? null,
      motherOccupation: data.motherOccupation ?? null,
      brothers: data.brothers ?? null,
      brothersMarried: data.brothersMarried ?? null,
      sisters: data.sisters ?? null,
      sistersMarried: data.sistersMarried ?? null,
      aboutMe: data.aboutMe ?? null,
      profileImage: data.profileImage ?? null,
    };

    const completion = calculateProfileCompletion(profileData);

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          profileFor: data.profileFor,
          phoneNumber: data.phoneNumber?.trim() || null,
          secondaryPhoneNumber: data.secondaryPhoneNumber?.trim() || null,
          emailVerified: true,
          isActive: true,
          createdByStaffId: staffResult.userId,
        })
        .returning({ id: users.id });

      const [profile] = await tx
        .insert(profiles)
        .values({
          userId: user.id,
          ...profileData,
          profileCompletion: completion,
        })
        .returning({ id: profiles.id });

      await tx.insert(subscriptions).values({
        userId: user.id,
        plan: "free",
        isActive: true,
        interestsPerDay: 5,
        contactViews: 0,
        profileBoosts: 0,
      });

      // Insert gallery images if provided
      if (data.galleryImages && data.galleryImages.length > 0) {
        const imageValues = data.galleryImages.map((url, idx) => ({
          profileId: profile.id,
          imageUrl: url,
          isPrimary: idx === 0 && !data.profileImage,
          sortOrder: idx,
        }));
        await tx.insert(profileImages).values(imageValues);
      }
    });

    return {
      success: true,
      message: `Profile created successfully for ${email}`,
      data: { userId: 0, email },
    };
  } catch (error) {
    console.error("Staff create profile error:", error);
    return { success: false, error: "Failed to create profile" };
  }
}

export async function staffGetMyCreatedUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ActionResult<{ users: StaffCreatedUser[]; total: number }>> {
  try {
    const staffResult = await requireStaff();
    if (staffResult.error) return staffResult.error;

    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;

    const conditions = [eq(users.createdByStaffId, staffResult.userId)];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      conditions.push(sql`LOWER(${users.email}) LIKE ${searchTerm}`);
    }

    const whereClause = and(...conditions);

    const usersList = await db.query.users.findMany({
      where: whereClause,
      with: { profile: true },
      orderBy: [desc(users.createdAt)],
      limit: validatedLimit,
      offset,
    });

    const [totalResult] = await db.select({ count: count() }).from(users).where(whereClause);

    const formatted: StaffCreatedUser[] = usersList.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.profile?.firstName || null,
      lastName: u.profile?.lastName || null,
      gender: u.profile?.gender || null,
      profileCompletion: u.profile?.profileCompletion || null,
      createdAt: u.createdAt,
    }));

    return {
      success: true,
      data: { users: formatted, total: totalResult.count },
    };
  } catch (error) {
    console.error("Staff get created users error:", error);
    return { success: false, error: "Failed to fetch profiles" };
  }
}

export async function staffGetCreatedUserCount(): Promise<ActionResult<number>> {
  try {
    const staffResult = await requireStaff();
    if (staffResult.error) return staffResult.error;

    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.createdByStaffId, staffResult.userId));

    return { success: true, data: result.count };
  } catch (error) {
    console.error("Staff get count error:", error);
    return { success: false, error: "Failed to fetch count" };
  }
}

export interface PlatformProfile {
  id: number;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  maritalStatus: string | null;
  height: number | null;
  religion: string | null;
  caste: string | null;
  residingState: string | null;
  residingCity: string | null;
  countryLivingIn: string | null;
  highestEducation: string | null;
  educationDetail: string | null;
  occupation: string | null;
  profileImage: string | null;
}

export async function staffGetAllPlatformProfiles(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ActionResult<{ users: PlatformProfile[]; total: number }>> {
  try {
    const staffResult = await requireStaff();
    if (staffResult.error) return staffResult.error;

    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const validatedPage = Math.max(1, page);
    const offset = (validatedPage - 1) * validatedLimit;

    const conditions = [eq(users.role, "user")];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${profiles.firstName}) LIKE ${searchTerm} OR LOWER(${profiles.lastName}) LIKE ${searchTerm} OR LOWER(${users.email}) LIKE ${searchTerm})`
      );
    }

    const whereClause = and(...conditions);

    const usersList = await db
      .select({
        id: users.id,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        gender: profiles.gender,
        dateOfBirth: profiles.dateOfBirth,
        maritalStatus: profiles.maritalStatus,
        height: profiles.height,
        religion: profiles.religion,
        caste: profiles.caste,
        residingState: profiles.residingState,
        residingCity: profiles.residingCity,
        countryLivingIn: profiles.countryLivingIn,
        highestEducation: profiles.highestEducation,
        educationDetail: profiles.educationDetail,
        occupation: profiles.occupation,
        profileImage: profiles.profileImage,
      })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(validatedLimit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(whereClause);

    return {
      success: true,
      data: { users: usersList, total: totalResult.count },
    };
  } catch (error) {
    console.error("Staff get all platform profiles error:", error);
    return { success: false, error: "Failed to fetch profiles" };
  }
}

export async function staffGetProfileDetails(targetUserId: number): Promise<
  ActionResult<{
    user: {
      id: number;
      email: string;
      phoneNumber: string | null;
      secondaryPhoneNumber: string | null;
      profileFor: string | null;
      createdAt: Date | null;
    };
    profile: {
      firstName: string | null;
      lastName: string | null;
      gender: string | null;
      dateOfBirth: string | null;
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
    };
    images: { id: number; imageUrl: string; sortOrder: number | null }[];
  }>
> {
  try {
    const staffResult = await requireStaff();
    if (staffResult.error) return staffResult.error;

    const user = await db.query.users.findFirst({
      where: and(eq(users.id, targetUserId), eq(users.createdByStaffId, staffResult.userId)),
      with: {
        profile: {
          with: { images: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Profile not found" };
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          secondaryPhoneNumber: user.secondaryPhoneNumber,
          profileFor: user.profileFor,
          createdAt: user.createdAt,
        },
        profile: {
          firstName: user.profile?.firstName || null,
          lastName: user.profile?.lastName || null,
          gender: user.profile?.gender || null,
          dateOfBirth: user.profile?.dateOfBirth || null,
          height: user.profile?.height || null,
          weight: user.profile?.weight || null,
          bodyType: user.profile?.bodyType || null,
          complexion: user.profile?.complexion || null,
          physicalStatus: user.profile?.physicalStatus || null,
          religion: user.profile?.religion || null,
          caste: user.profile?.caste || null,
          subCaste: user.profile?.subCaste || null,
          motherTongue: user.profile?.motherTongue || null,
          gothra: user.profile?.gothra || null,
          countryLivingIn: user.profile?.countryLivingIn || null,
          residingState: user.profile?.residingState || null,
          residingCity: user.profile?.residingCity || null,
          citizenship: user.profile?.citizenship || null,
          highestEducation: user.profile?.highestEducation || null,
          educationDetail: user.profile?.educationDetail || null,
          employedIn: user.profile?.employedIn || null,
          occupation: user.profile?.occupation || null,
          jobTitle: user.profile?.jobTitle || null,
          annualIncome: user.profile?.annualIncome || null,
          maritalStatus: user.profile?.maritalStatus || null,
          diet: user.profile?.diet || null,
          smoking: user.profile?.smoking || null,
          drinking: user.profile?.drinking || null,
          hobbies: user.profile?.hobbies || null,
          familyStatus: user.profile?.familyStatus || null,
          familyType: user.profile?.familyType || null,
          familyValue: user.profile?.familyValue || null,
          fatherOccupation: user.profile?.fatherOccupation || null,
          motherOccupation: user.profile?.motherOccupation || null,
          brothers: user.profile?.brothers || null,
          brothersMarried: user.profile?.brothersMarried || null,
          sisters: user.profile?.sisters || null,
          sistersMarried: user.profile?.sistersMarried || null,
          aboutMe: user.profile?.aboutMe || null,
          profileImage: user.profile?.profileImage || null,
          profileCompletion: user.profile?.profileCompletion || null,
        },
        images:
          user.profile?.images?.map(
            (img: { id: number; imageUrl: string; sortOrder: number | null }) => ({
              id: img.id,
              imageUrl: img.imageUrl,
              sortOrder: img.sortOrder,
            })
          ) || [],
      },
    };
  } catch (error) {
    console.error("Staff get profile details error:", error);
    return { success: false, error: "Failed to fetch profile details" };
  }
}
