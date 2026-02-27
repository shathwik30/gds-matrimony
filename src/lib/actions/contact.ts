"use server";

import { sendEmail } from "@/lib/email";
import { db, contactSubmissions, siteSettings } from "@/lib/db";
import { escapeHtml } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";
import type { ActionResult } from "@/types";

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData): Promise<ActionResult> {
  try {
    // Rate limit: max 3 submissions per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [recentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(
        sql`${contactSubmissions.email} = ${data.email?.trim()?.toLowerCase()} AND ${contactSubmissions.createdAt} >= ${oneHourAgo}`
      );
    if (Number(recentCount?.count || 0) >= 3) {
      return {
        success: false,
        error: "Too many submissions. Please try again later.",
      };
    }

    // Validate required fields
    if (
      !data.name?.trim() ||
      !data.email?.trim() ||
      !data.subject?.trim() ||
      !data.message?.trim()
    ) {
      return { success: false, error: "All required fields must be filled" };
    }

    // Validate field lengths
    if (data.name.trim().length > 100) {
      return { success: false, error: "Name must not exceed 100 characters" };
    }
    if (data.subject.trim().length > 200) {
      return { success: false, error: "Subject must not exceed 200 characters" };
    }
    if (data.phone && data.phone.trim().length > 20) {
      return { success: false, error: "Phone number is too long" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: "Please enter a valid email address" };
    }
    if (data.email.length > 254) {
      return { success: false, error: "Email address is too long" };
    }

    // Validate message length
    if (data.message.length < 10) {
      return { success: false, error: "Message must be at least 10 characters" };
    }

    if (data.message.length > 2000) {
      return { success: false, error: "Message must not exceed 2000 characters" };
    }

    // Read support email from DB settings, falling back to env vars
    const [dbSupportEmail] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "supportEmail"))
      .limit(1);
    const [dbSiteName] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "siteName"))
      .limit(1);

    const APP_NAME = dbSiteName?.value || process.env.NEXT_PUBLIC_APP_NAME || "GDS Marriage Links";
    const SUPPORT_EMAIL =
      dbSupportEmail?.value ||
      process.env.SUPPORT_EMAIL ||
      process.env.FROM_EMAIL ||
      "support@gdsmarriagelinks.com";

    const safeName = escapeHtml(data.name);
    const safeEmail = escapeHtml(data.email);
    const safePhone = data.phone ? escapeHtml(data.phone) : "";
    const safeSubject = escapeHtml(data.subject);
    const safeMessage = escapeHtml(data.message);

    // Save to database (don't block user if this fails)
    try {
      await db.insert(contactSubmissions).values({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
      });
    } catch (dbError) {
      console.error("Failed to save contact submission to DB:", dbError);
    }

    // Send email to support team
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #C00F0C; margin-top: 0;">New Contact Form Submission</h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <a href="mailto:${safeEmail}" style="color: #C00F0C;">${safeEmail}</a>
              </td>
            </tr>
            ${
              safePhone
                ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${safePhone}</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${safeSubject}</td>
            </tr>
          </table>

          <h3 style="color: #333;">Message:</h3>
          <div style="padding: 15px; background-color: #f9f9f9; border-radius: 4px; white-space: pre-wrap;">${safeMessage}</div>

          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            This message was sent via the contact form on ${APP_NAME}
          </p>
        </div>
      </body>
      </html>
    `;

    // Sanitize email subject to prevent header injection
    const sanitizedSubject = data.subject.replace(/[\r\n]/g, " ").slice(0, 200);
    const sanitizedName = data.name.replace(/[\r\n]/g, " ").slice(0, 100);

    const result = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Contact Form] ${sanitizedSubject} - ${sanitizedName}`,
      html: emailHtml,
    });

    if (!result.success) {
      console.error("Failed to send contact email:", result.error);
      return { success: false, error: "Failed to send message. Please try again." };
    }

    // Send confirmation to user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>We Received Your Message</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #C00F0C; margin-top: 0;">Thank You for Contacting Us!</h2>

          <p style="color: #666; line-height: 1.6;">Dear ${safeName},</p>

          <p style="color: #666; line-height: 1.6;">
            We have received your message and will get back to you within 24-48 hours.
          </p>

          <div style="padding: 15px; background-color: #f9f9f9; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #666;"><strong>Subject:</strong> ${safeSubject}</p>
          </div>

          <p style="color: #666; line-height: 1.6;">
            If your inquiry is urgent, please contact us directly at:<br>
            <a href="mailto:${SUPPORT_EMAIL}" style="color: #C00F0C;">${SUPPORT_EMAIL}</a>
          </p>

          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            The ${APP_NAME} Team
          </p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: data.email,
      subject: `We received your message - ${APP_NAME}`,
      html: confirmationHtml,
    });

    return {
      success: true,
      message: "Thank you! Your message has been sent successfully. We'll get back to you soon.",
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
