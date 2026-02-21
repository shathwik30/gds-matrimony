"use server";

import { db, blocks, reports } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/actions/helpers";
import type { ActionResult } from "@/types";

// Block a user
export async function blockUser(blockedUserId: number, reason?: string): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const blockerId = authResult.userId;

    if (blockerId === blockedUserId) {
      return { success: false, error: "Cannot block yourself" };
    }

    // Check if already blocked
    const existing = await db.query.blocks.findFirst({
      where: and(
        eq(blocks.blockerId, blockerId),
        eq(blocks.blockedUserId, blockedUserId)
      ),
    });

    if (existing) {
      return { success: false, error: "User already blocked" };
    }

    await db.insert(blocks).values({
      blockerId,
      blockedUserId,
      reason: reason || null,
    });

    return { success: true, message: "User blocked successfully" };
  } catch (error) {
    console.error("Block user error:", error);
    return { success: false, error: "Failed to block user" };
  }
}

// Unblock a user
export async function unblockUser(blockedUserId: number): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const blockerId = authResult.userId;

    await db
      .delete(blocks)
      .where(
        and(
          eq(blocks.blockerId, blockerId),
          eq(blocks.blockedUserId, blockedUserId)
        )
      );

    return { success: true, message: "User unblocked" };
  } catch (error) {
    console.error("Unblock user error:", error);
    return { success: false, error: "Failed to unblock user" };
  }
}

// Report a user
export async function reportUser(
  reportedUserId: number,
  reason: string,
  description?: string
): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const reporterId = authResult.userId;

    if (reporterId === reportedUserId) {
      return { success: false, error: "Cannot report yourself" };
    }

    if (!reason.trim() || reason.trim().length > 255) {
      return { success: false, error: "Report reason must be between 1 and 255 characters" };
    }

    if (description && description.trim().length > 2000) {
      return { success: false, error: "Description is too long (max 2000 characters)" };
    }

    // Check for existing pending report from this user
    const [existingReport] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, reporterId),
          eq(reports.reportedUserId, reportedUserId),
          eq(reports.status, "pending")
        )
      )
      .limit(1);

    if (existingReport) {
      return { success: false, error: "You have already reported this user. Our team is reviewing it." };
    }

    await db.insert(reports).values({
      reporterId,
      reportedUserId,
      reason,
      description: description || null,
    });

    return { success: true, message: "Report submitted. We will review it shortly." };
  } catch (error) {
    console.error("Report user error:", error);
    return { success: false, error: "Failed to submit report" };
  }
}

// Check if a user is blocked by current user
export async function isUserBlocked(otherUserId: number): Promise<ActionResult<boolean>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const blockExists = await db.query.blocks.findFirst({
      where: and(
        eq(blocks.blockerId, userId),
        eq(blocks.blockedUserId, otherUserId)
      ),
    });

    return { success: true, data: !!blockExists };
  } catch (error) {
    console.error("Check block error:", error);
    return { success: false, error: "Failed to check block status" };
  }
}
