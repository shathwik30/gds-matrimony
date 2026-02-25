"use server";

import { db, users, profiles, subscriptions, otps } from "@/lib/db";
import { eq, and, gt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getWelcomeEmailTemplate,
} from "@/lib/email";
import { generateOTP } from "@/lib/utils/server";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type VerifyOtpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { ActionResult } from "@/types";
import { OTP_CONFIG } from "@/constants";
import { parseAdminEmails } from "@/lib/utils";

import { env as serverEnv, clientEnv as clientEnvConfig } from "@/lib/env";

const AUTH_SECRET = serverEnv.AUTH_SECRET;
const APP_URL = clientEnvConfig.APP_URL;

export async function registerUser(data: RegisterInput): Promise<ActionResult> {
  try {
    // Validate input
    const validated = registerSchema.parse(data);

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validated.email.toLowerCase()),
    });

    if (existingUser) {
      return {
        success: false,
        error:
          "Registration failed. Please try a different email or login to your existing account.",
      };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: validated.email.toLowerCase(),
          password: hashedPassword,
          profileFor: validated.profileFor,
          emailVerified: false,
        })
        .returning({ id: users.id });

      await tx.insert(profiles).values({
        userId: user.id,
      });

      await tx.insert(subscriptions).values({
        userId: user.id,
        plan: "free",
        isActive: true,
        interestsPerDay: 5,
        contactViews: 0,
        profileBoosts: 0,
      });

      return [user];
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    await db.insert(otps).values({
      email: validated.email.toLowerCase(),
      otp,
      type: "email_verification",
      expiresAt,
    });

    await sendEmail({
      to: validated.email,
      subject: "Verify your email - GDS Marriage Links",
      html: getVerificationEmailTemplate(otp),
    });

    return {
      success: true,
      message: "Registration successful! Please verify your email.",
      data: { email: validated.email },
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}

export async function verifyEmailOTP(data: VerifyOtpInput): Promise<ActionResult> {
  try {
    const validated = verifyOtpSchema.parse(data);

    const otpRecord = await db.query.otps.findFirst({
      where: and(
        eq(otps.email, validated.email.toLowerCase()),
        eq(otps.type, "email_verification"),
        eq(otps.isUsed, false),
        gt(otps.expiresAt, new Date())
      ),
      orderBy: (otps, { desc }) => [desc(otps.createdAt)],
    });

    if (!otpRecord) {
      return { success: false, error: "Invalid or expired OTP. Please request a new one." };
    }

    if (otpRecord.attempts !== null && otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await db.update(otps).set({ isUsed: true }).where(eq(otps.id, otpRecord.id));
      return { success: false, error: "Too many attempts. Please request a new OTP." };
    }

    const otpMatch =
      otpRecord.otp.length === validated.otp.length &&
      crypto.timingSafeEqual(Buffer.from(otpRecord.otp), Buffer.from(validated.otp));
    if (!otpMatch) {
      await db
        .update(otps)
        .set({ attempts: (otpRecord.attempts || 0) + 1 })
        .where(eq(otps.id, otpRecord.id));
      return { success: false, error: "Invalid OTP. Please try again." };
    }

    const txResult = await db.transaction(async (tx) => {
      const [markedUsed] = await tx
        .update(otps)
        .set({ isUsed: true })
        .where(and(eq(otps.id, otpRecord.id), eq(otps.isUsed, false)))
        .returning({ id: otps.id });

      if (!markedUsed) return null;

      await tx
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.email, validated.email.toLowerCase()));

      return markedUsed;
    });

    if (!txResult) {
      return { success: false, error: "OTP already used. Please request a new one." };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email.toLowerCase()),
      with: { profile: true },
    });

    if (user) {
      await sendEmail({
        to: validated.email,
        subject: "Welcome to GDS Marriage Links!",
        html: getWelcomeEmailTemplate(user.profile?.firstName || "there"),
      });
    }

    return {
      success: true,
      message: "Email verified successfully! You can now login.",
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return { success: false, error: "Verification failed. Please try again." };
  }
}

export async function resendOTP(email: string): Promise<ActionResult> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      // Return generic message to prevent email enumeration
      return { success: true, message: "If the email exists, a new OTP has been sent." };
    }

    if (user.emailVerified) {
      return { success: true, message: "If the email exists, a new OTP has been sent." };
    }

    const cooldownTime = new Date(Date.now() - OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000);
    const recentOtp = await db.query.otps.findFirst({
      where: and(
        eq(otps.email, email.toLowerCase()),
        eq(otps.type, "email_verification"),
        gt(otps.createdAt, cooldownTime)
      ),
      orderBy: (otps, { desc }) => [desc(otps.createdAt)],
    });

    if (recentOtp) {
      return {
        success: false,
        error: `Please wait ${OTP_CONFIG.RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP.`,
      };
    }

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentOtpCount = await db
      .select({ count: sql`count(*)` })
      .from(otps)
      .where(
        and(
          eq(otps.email, email.toLowerCase()),
          eq(otps.type, "email_verification"),
          gt(otps.createdAt, thirtyMinAgo)
        )
      );

    if (Number(recentOtpCount[0]?.count || 0) >= 3) {
      return { success: false, error: "Too many OTP requests. Please try again after 30 minutes." };
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    await db.insert(otps).values({
      email: email.toLowerCase(),
      otp,
      type: "email_verification",
      expiresAt,
    });

    await sendEmail({
      to: email,
      subject: "Verify your email - GDS Marriage Links",
      html: getVerificationEmailTemplate(otp),
    });

    return { success: true, message: "OTP sent successfully!" };
  } catch (error) {
    console.error("Resend OTP error:", error);
    return { success: false, error: "Failed to send OTP. Please try again." };
  }
}

export async function loginUser(data: LoginInput): Promise<ActionResult<{ isAdmin?: boolean }>> {
  try {
    const validated = loginSchema.parse(data);
    const email = validated.email.toLowerCase();

    const result = await signIn("credentials", {
      email,
      password: validated.password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
    const isAdmin = adminEmails.includes(email);

    return { success: true, message: "Login successful!", data: { isAdmin } };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error) {
      const cause = (error as Error & { cause?: { err?: { message?: string } } }).cause;
      if (cause?.err?.message) {
        return { success: false, error: cause.err.message };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "Login failed. Please check your credentials." };
  }
}

export async function logoutUser(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function forgotPassword(data: ForgotPasswordInput): Promise<ActionResult> {
  try {
    const validated = forgotPasswordSchema.parse(data);

    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email.toLowerCase()),
      with: { profile: true },
    });

    if (!user) {
      return {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      };
    }

    const resetNonce = crypto.randomBytes(16).toString("hex");

    await db.insert(otps).values({
      email: user.email.toLowerCase(),
      otp: resetNonce,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const token = jwt.sign({ userId: user.id, email: user.email, nonce: resetNonce }, AUTH_SECRET, {
      expiresIn: "1h",
    });

    const resetLink = `${APP_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: validated.email,
      subject: "Reset your password - GDS Marriage Links",
      html: getPasswordResetEmailTemplate(resetLink, user.profile?.firstName || undefined),
    });

    return {
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, error: "Failed to process request. Please try again." };
  }
}

export async function resetPassword(
  data: ResetPasswordInput & { token: string }
): Promise<ActionResult> {
  try {
    const { token, ...passwordData } = data;
    const validated = resetPasswordSchema.parse(passwordData);

    let decoded: { userId: number; email: string; nonce?: string; pwh?: string };
    try {
      decoded = jwt.verify(token, AUTH_SECRET) as {
        userId: number;
        email: string;
        nonce?: string;
        pwh?: string;
      };
    } catch {
      return { success: false, error: "Invalid or expired reset link" };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });

    if (!user || !user.isActive) {
      return { success: false, error: "Account not found or has been deactivated" };
    }

    if (decoded.nonce) {
      const [usedNonce] = await db
        .update(otps)
        .set({ isUsed: true })
        .where(
          and(
            eq(otps.email, user.email.toLowerCase()),
            eq(otps.type, "password_reset"),
            eq(otps.otp, decoded.nonce),
            eq(otps.isUsed, false)
          )
        )
        .returning({ id: otps.id });

      if (!usedNonce) {
        return {
          success: false,
          error: "This reset link has already been used. Please request a new one.",
        };
      }
    } else if (decoded.pwh && user.password.slice(-8) !== decoded.pwh) {
      return {
        success: false,
        error: "This reset link has already been used. Please request a new one.",
      };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, decoded.userId));

    return { success: true, message: "Password reset successfully! You can now login." };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
