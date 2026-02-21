import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db, users, profiles, subscriptions, interests } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import { parseUserId } from "@/lib/utils";

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const userId = parseUserId(session?.user?.id);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require password re-authentication
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Password confirmation required" }, { status: 400 });
    }

    const { password } = (body as { password?: unknown }) || {};
    if (typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Password is required to delete account" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is already deactivated" }, { status: 400 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "Cannot verify password for this account type" }, { status: 400 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    }

    // Deactivate user account atomically (soft delete)
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, userId));

      await tx
        .update(profiles)
        .set({ hideProfile: true, updatedAt: new Date() })
        .where(eq(profiles.userId, userId));

      await tx
        .update(subscriptions)
        .set({ isActive: false })
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.isActive, true)));

      await tx
        .update(interests)
        .set({ status: "rejected", respondedAt: new Date() })
        .where(
          and(
            or(eq(interests.senderId, userId), eq(interests.receiverId, userId)),
            or(eq(interests.status, "pending"), eq(interests.status, "accepted"))
          )
        );
    });

    return NextResponse.json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
