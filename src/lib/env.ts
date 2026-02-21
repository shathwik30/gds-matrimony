/**
 * Environment variable validation
 * This file validates required environment variables at build time
 */

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

// Server-side environment variables (only available on server)
export const env = {
  // Database
  DATABASE_URL: getRequiredEnvVar("DATABASE_URL"),

  // Authentication
  AUTH_SECRET: getRequiredEnvVar("AUTH_SECRET"),
  NEXTAUTH_URL: getOptionalEnvVar("NEXTAUTH_URL", "http://localhost:3000"),

  // Email (Resend)
  RESEND_API_KEY: getRequiredEnvVar("RESEND_API_KEY"),
  FROM_EMAIL: getOptionalEnvVar("FROM_EMAIL", "noreply@gdsmarriagelinks.com"),
  SUPPORT_EMAIL: getOptionalEnvVar("SUPPORT_EMAIL", "support@gdsmarriagelinks.com"),

  // Payment (Razorpay) - optional, skip if not configured
  RAZORPAY_KEY_ID: getOptionalEnvVar("RAZORPAY_KEY_ID", ""),
  RAZORPAY_KEY_SECRET: getOptionalEnvVar("RAZORPAY_KEY_SECRET", ""),
  RAZORPAY_WEBHOOK_SECRET: getOptionalEnvVar("RAZORPAY_WEBHOOK_SECRET", ""),

  // File Upload (UploadThing)
  UPLOADTHING_TOKEN: getRequiredEnvVar("UPLOADTHING_TOKEN"),

  // Admin (explicit list only - no domain wildcards)
  ADMIN_EMAILS: getOptionalEnvVar("ADMIN_EMAILS", "admin@gdsmarriagelinks.com"),
};

// Client-side environment variables (exposed to browser)
export const clientEnv = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "GDS Marriage Links",
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
};
