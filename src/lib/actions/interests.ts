"use server";

import { db, interests, profiles, users } from "@/lib/db";
import { eq, and, or, desc, gte, sql } from "drizzle-orm";
import { calculateAge } from "@/lib/utils";
import { sendInterestEmail, sendInterestAcceptedEmail } from "@/lib/email";
import { logActivity } from "@/lib/actions/activity";
import { getActiveSubscription } from "@/lib/actions/subscription";
import { requireAuth, checkBlocked } from "@/lib/actions/helpers";
import { isUnlimited } from "@/lib/utils/subscription";
import type { ActionResult, InterestWithProfile } from "@/types";

// Format a profile record into the InterestWithProfile shape
function formatInterestProfile(
  interest: { id: number; status: "pending" | "accepted" | "rejected" | null; createdAt: Date | null },
  profile: {
    id: number; userId: number; firstName: string | null; lastName: string | null;
    gender: "male" | "female" | null; dateOfBirth: string | null; height: number | null;
    religion: string | null; caste: string | null; residingCity: string | null;
    residingState: string | null; highestEducation: string | null; occupation: string | null;
    profileImage: string | null; profileCompletion: number | null;
    trustLevel: "new_member" | "verified_user" | "highly_trusted" | null;
    user?: { lastActive: Date | null } | null;
  }
): InterestWithProfile {
  return {
    id: interest.id,
    status: interest.status,
    createdAt: interest.createdAt,
    profile: {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      age: profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 0,
      height: profile.height,
      religion: profile.religion,
      caste: profile.caste,
      residingCity: profile.residingCity,
      residingState: profile.residingState,
      highestEducation: profile.highestEducation,
      occupation: profile.occupation,
      profileImage: profile.profileImage,
      profileCompletion: profile.profileCompletion || 0,
      trustLevel: profile.trustLevel,
      lastActive: profile.user?.lastActive || undefined,
    },
  };
}

// Send interest to a profile
export async function sendInterest(toUserId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const senderId = authResult.userId;

    if (senderId === toUserId) {
      return { success: false, error: "You cannot send interest to yourself" };
    }

    if (await checkBlocked(senderId, toUserId)) {
      return { success: false, error: "Cannot send interest to this user" };
    }

    // Check if target user is active
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, toUserId),
      columns: { isActive: true },
    });
    if (!targetUser || !targetUser.isActive) {
      return { success: false, error: "This user is no longer active" };
    }

    // Check if interest already exists
    const existingInterest = await db.query.interests.findFirst({
      where: and(
        eq(interests.senderId, senderId),
        eq(interests.receiverId, toUserId)
      ),
    });

    if (existingInterest) {
      return { success: false, error: "Interest already sent" };
    }

    // Check subscription limits (auto-deactivates if expired)
    const subscription = await getActiveSubscription(senderId);
    const interestsPerDay = subscription ? (subscription.interestsPerDay ?? 5) : 5;

    // Skip limit check for unlimited plans
    if (!isUnlimited(interestsPerDay)) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Use transaction to prevent race condition between count check and insert
      const limitResult = await db.transaction(async (tx) => {
        const countResult = await tx
          .select({ count: sql<number>`count(*)` })
          .from(interests)
          .where(
            and(
              eq(interests.senderId, senderId),
              gte(interests.createdAt, todayStart)
            )
          );

        const todayCount = Number(countResult[0]?.count || 0);

        if (todayCount >= interestsPerDay) {
          return { limitReached: true };
        }

        await tx.insert(interests).values({
          senderId,
          receiverId: toUserId,
          status: "pending",
        });

        return { limitReached: false };
      });

      if (limitResult.limitReached) {
        return {
          success: false,
          error: `Daily limit of ${interestsPerDay} interests reached. ${!subscription ? "Upgrade to send more interests." : "Upgrade your plan for more."}`
        };
      }
    } else {
      // Unlimited plan - just insert
      await db.insert(interests).values({
        senderId,
        receiverId: toUserId,
        status: "pending",
      });
    }

    // Send email notification (non-blocking - don't fail interest if email fails)
    try {
      const [senderProfile, receiverProfile] = await Promise.all([
        db.query.profiles.findFirst({
          where: eq(profiles.userId, senderId),
          with: { user: true },
        }),
        db.query.profiles.findFirst({
          where: eq(profiles.userId, toUserId),
          with: { user: true },
        }),
      ]);

      if (receiverProfile?.user?.email && senderProfile) {
        await sendInterestEmail(
          receiverProfile.user.email,
          `${senderProfile.firstName || "Someone"}`
        );
      }
    } catch (emailError) {
      console.error("Failed to send interest email:", emailError);
    }

    // Log activity (non-blocking)
    try {
      await logActivity(senderId, "interest_sent", toUserId);
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return { success: true, message: "Interest sent successfully" };
  } catch (error) {
    console.error("Send interest error:", error);
    return { success: false, error: "Failed to send interest" };
  }
}

// Respond to interest (accept/decline)
export async function respondToInterest(
  interestId: number,
  status: "accepted" | "rejected"
): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Get interest
    const interest = await db.query.interests.findFirst({
      where: and(
        eq(interests.id, interestId),
        eq(interests.receiverId, userId)
      ),
    });

    if (!interest) {
      return { success: false, error: "Interest not found" };
    }

    if (interest.status !== "pending") {
      return { success: false, error: "Interest already responded" };
    }

    // Atomically update interest status (prevents race condition)
    const [updated] = await db
      .update(interests)
      .set({ status, respondedAt: new Date() })
      .where(and(eq(interests.id, interestId), eq(interests.status, "pending")))
      .returning({ id: interests.id });

    if (!updated) {
      return { success: false, error: "Interest already responded" };
    }

    // Send notification email if accepted
    if (status === "accepted") {
      try {
        const [senderUser, accepterProfile] = await Promise.all([
          db.query.users.findFirst({ where: eq(users.id, interest.senderId) }),
          db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
        ]);

        if (senderUser && accepterProfile) {
          const accepterName = `${accepterProfile.firstName || ""} ${accepterProfile.lastName || ""}`.trim() || "Someone";
          await sendInterestAcceptedEmail(senderUser.email, accepterName);
        }
      } catch (emailError) {
        console.error("Failed to send acceptance email:", emailError);
        // Don't fail the response if email fails
      }
    }

    // Log activity
    await logActivity(
      userId,
      status === "accepted" ? "interest_accepted" : "interest_rejected",
      interest.senderId
    );

    return {
      success: true,
      message: status === "accepted"
        ? "Interest accepted! You can now message each other."
        : "Interest rejected"
    };
  } catch (error) {
    console.error("Respond to interest error:", error);
    return { success: false, error: "Failed to respond to interest" };
  }
}

// Get received interests
export async function getReceivedInterests(): Promise<ActionResult<InterestWithProfile[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const received = await db.query.interests.findMany({
      where: eq(interests.receiverId, userId),
      orderBy: [desc(interests.createdAt)],
      with: {
        fromProfile: {
          with: {
            user: {
              columns: {
                id: true,
                lastActive: true,
              },
            },
          },
        },
      },
    });

    const formatted = received.map((interest) =>
      formatInterestProfile(interest, interest.fromProfile)
    );

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Get received interests error:", error);
    return { success: false, error: "Failed to fetch interests" };
  }
}

// Get sent interests
export async function getSentInterests(): Promise<ActionResult<InterestWithProfile[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const sent = await db.query.interests.findMany({
      where: eq(interests.senderId, userId),
      orderBy: [desc(interests.createdAt)],
      with: {
        toProfile: {
          with: {
            user: {
              columns: {
                id: true,
                lastActive: true,
              },
            },
          },
        },
      },
    });

    const formatted = sent.map((interest) =>
      formatInterestProfile(interest, interest.toProfile)
    );

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Get sent interests error:", error);
    return { success: false, error: "Failed to fetch interests" };
  }
}

// Get accepted interests (mutual connections)
export async function getAcceptedInterests(): Promise<ActionResult<InterestWithProfile[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const accepted = await db.query.interests.findMany({
      where: and(
        or(
          eq(interests.senderId, userId),
          eq(interests.receiverId, userId)
        ),
        eq(interests.status, "accepted")
      ),
      orderBy: [desc(interests.respondedAt)],
      with: {
        fromProfile: {
          with: {
            user: {
              columns: {
                id: true,
                lastActive: true,
              },
            },
          },
        },
        toProfile: {
          with: {
            user: {
              columns: {
                id: true,
                lastActive: true,
              },
            },
          },
        },
      },
    });

    const formatted = accepted.map((interest) => {
      const isFromMe = interest.senderId === userId;
      const otherProfile = isFromMe ? interest.toProfile : interest.fromProfile;
      return formatInterestProfile(interest, otherProfile);
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Get accepted interests error:", error);
    return { success: false, error: "Failed to fetch interests" };
  }
}
