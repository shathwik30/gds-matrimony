import { Resend } from "resend";
import { env, clientEnv } from "@/lib/env";
import { escapeHtml } from "@/lib/utils";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = env.FROM_EMAIL;
const APP_NAME = clientEnv.APP_NAME;

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "#";
    }
    return parsed.toString();
  } catch {
    return "#";
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // In development mode, just log the email instead of sending
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    console.log("\n=== 📧 EMAIL (Development Mode) ===");
    console.log("To:", to);
    console.log("Subject:", subject);

    const otpMatch = html.match(/letter-spacing: 8px;">(\d{6})</);
    if (otpMatch) {
      console.log("🔑 OTP:", otpMatch[1]);
    }

    console.log("=====================================\n");

    return { success: true, data: { id: "dev-mode-email" } };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send exception:", error);
    return { success: false, error };
  }
}

export function getVerificationEmailTemplate(otp: string, name?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #C00F0C; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Verify Your Email</h2>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    ${name ? `Hello ${escapeHtml(name)},` : "Hello,"}
                  </p>
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Thank you for registering with ${APP_NAME}. Please use the following OTP to verify your email address:
                  </p>

                  <!-- OTP Box -->
                  <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 20px 40px; background-color: #FFEEDA; border-radius: 8px; border: 2px dashed #C00F0C;">
                      <span style="font-size: 36px; font-weight: bold; color: #C00F0C; letter-spacing: 8px;">${escapeHtml(otp)}</span>
                    </div>
                  </div>

                  <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                    This OTP is valid for 10 minutes. If you didn't request this verification, please ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #FFEBEB; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getPasswordResetEmailTemplate(resetLink: string, name?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #C00F0C; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Reset Your Password</h2>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    ${name ? `Hello ${escapeHtml(name)},` : "Hello,"}
                  </p>
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>

                  <!-- Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sanitizeUrl(resetLink)}" style="display: inline-block; padding: 15px 40px; background-color: #C00F0C; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Reset Password
                    </a>
                  </div>

                  <p style="margin: 30px 0 10px; color: #999999; font-size: 14px; line-height: 1.5;">
                    This link is valid for 1 hour. If you didn't request a password reset, please ignore this email.
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    If the button doesn't work, copy and paste this link: ${escapeHtml(sanitizeUrl(resetLink))}
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #FFEBEB; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getInterestNotificationTemplate(
  senderName: string,
  senderImage?: string,
  profileLink?: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Interest Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #C00F0C; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px; text-align: center;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Someone is interested in you!</h2>

                  ${
                    senderImage
                      ? `<img src="${escapeHtml(sanitizeUrl(senderImage))}" alt="${escapeHtml(senderName)}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 20px 0; border: 4px solid #FFEEDA;">`
                      : ""
                  }

                  <p style="margin: 20px 0; color: #666666; font-size: 18px;">
                    <strong style="color: #C00F0C;">${escapeHtml(senderName)}</strong> has sent you an interest!
                  </p>

                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Log in to view their profile and respond to this interest.
                  </p>

                  <!-- Button -->
                  <div style="margin: 30px 0;">
                    <a href="${sanitizeUrl(profileLink || clientEnv.APP_URL || "")}" style="display: inline-block; padding: 15px 40px; background-color: #C00F0C; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      View Profile
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #FFEBEB; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendInterestEmail(toEmail: string, senderName: string) {
  const profileLink = `${clientEnv.APP_URL}/interests`;
  const html = getInterestNotificationTemplate(senderName, undefined, profileLink);

  return sendEmail({
    to: toEmail,
    subject: `${senderName} has sent you an interest - ${APP_NAME}`,
    html,
  });
}

export function getInterestAcceptedTemplate(accepterName: string, profileLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interest Accepted</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #10B981; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px; text-align: center;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Great News!</h2>
                  <p style="margin: 20px 0; color: #666666; font-size: 18px;">
                    <strong style="color: #10B981;">${escapeHtml(accepterName)}</strong> has accepted your interest!
                  </p>
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                    You can now message each other. Start a conversation and get to know each other better.
                  </p>
                  <div style="margin: 30px 0;">
                    <a href="${sanitizeUrl(profileLink)}" style="display: inline-block; padding: 15px 40px; background-color: #10B981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Start Chatting
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #ECFDF5; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendInterestAcceptedEmail(toEmail: string, accepterName: string) {
  const profileLink = `${clientEnv.APP_URL}/messages`;
  const html = getInterestAcceptedTemplate(accepterName, profileLink);

  return sendEmail({
    to: toEmail,
    subject: `${accepterName} accepted your interest - ${APP_NAME}`,
    html,
  });
}

export function getNewMessageTemplate(senderName: string, messagePreview: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Message</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #C00F0C; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">New Message from ${escapeHtml(senderName)}</h2>
                  <div style="padding: 20px; background-color: #f4f4f4; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #666666; font-size: 16px; font-style: italic;">
                      "${escapeHtml(messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview)}"
                    </p>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sanitizeUrl(`${clientEnv.APP_URL}/messages`)}" style="display: inline-block; padding: 15px 40px; background-color: #C00F0C; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Read Message
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #FFEBEB; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendNewMessageEmail(
  toEmail: string,
  senderName: string,
  messagePreview: string
) {
  const html = getNewMessageTemplate(senderName, messagePreview);

  return sendEmail({
    to: toEmail,
    subject: `New message from ${senderName} - ${APP_NAME}`,
    html,
  });
}

export function getSubscriptionExpiryTemplate(
  name: string,
  daysRemaining: number,
  planName: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Expiring Soon</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #F59E0B; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Your Subscription is Expiring Soon</h2>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Hello ${escapeHtml(name)},
                  </p>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Your <strong>${escapeHtml(planName)}</strong> subscription will expire in <strong style="color: #F59E0B;">${daysRemaining} day${daysRemaining > 1 ? "s" : ""}</strong>.
                  </p>
                  <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Renew now to continue enjoying unlimited access to all premium features and keep connecting with potential matches.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sanitizeUrl(`${clientEnv.APP_URL}/membership`)}" style="display: inline-block; padding: 15px 40px; background-color: #F59E0B; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Renew Subscription
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #FEF3C7; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendSubscriptionExpiryEmail(
  toEmail: string,
  name: string,
  daysRemaining: number,
  planName: string
) {
  const html = getSubscriptionExpiryTemplate(name, daysRemaining, planName);

  return sendEmail({
    to: toEmail,
    subject: `Your ${planName} subscription expires in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""} - ${APP_NAME}`,
    html,
  });
}

export function getAccountSuspensionTemplate(name: string, reason: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Suspended</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #EF4444; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Account Suspended</h2>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Hello ${escapeHtml(name)},
                  </p>
                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Your account has been suspended due to a violation of our terms of service.
                  </p>
                  <div style="padding: 20px; background-color: #FEE2E2; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #991B1B; font-size: 14px;">
                      <strong>Reason:</strong> ${escapeHtml(reason)}
                    </p>
                  </div>
                  <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                    If you believe this was a mistake, please contact our support team.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sanitizeUrl(`${clientEnv.APP_URL}/contact`)}" style="display: inline-block; padding: 15px 40px; background-color: #6B7280; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Contact Support
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: #FEE2E2; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendAccountSuspensionEmail(toEmail: string, name: string, reason: string) {
  const html = getAccountSuspensionTemplate(name, reason);

  return sendEmail({
    to: toEmail,
    subject: `Account Suspension Notice - ${APP_NAME}`,
    html,
  });
}

export function getWelcomeEmailTemplate(name: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${APP_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background-color: #C00F0C; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${APP_NAME}</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Welcome, ${escapeHtml(name)}!</h2>

                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Thank you for joining ${APP_NAME}. We're excited to help you find your perfect life partner.
                  </p>

                  <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                    Here's what you can do next:
                  </p>

                  <ul style="margin: 0 0 30px; padding-left: 20px; color: #666666; font-size: 16px; line-height: 2;">
                    <li>Complete your profile to get better matches</li>
                    <li>Add your photos to increase profile visibility</li>
                    <li>Set your partner preferences</li>
                    <li>Start browsing verified profiles</li>
                  </ul>

                  <!-- Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${sanitizeUrl(`${clientEnv.APP_URL}/dashboard`)}" style="display: inline-block; padding: 15px 40px; background-color: #C00F0C; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                      Complete Your Profile
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #FFEBEB; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; color: #666666; font-size: 12px;">
                    © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
