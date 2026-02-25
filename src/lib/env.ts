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

export const env = {
  DATABASE_URL: getRequiredEnvVar("DATABASE_URL"),
  AUTH_SECRET: getRequiredEnvVar("AUTH_SECRET"),
  NEXTAUTH_URL: getOptionalEnvVar("NEXTAUTH_URL", "http://localhost:3000"),
  RESEND_API_KEY: getRequiredEnvVar("RESEND_API_KEY"),
  FROM_EMAIL: getOptionalEnvVar("FROM_EMAIL", "noreply@gdsmarriagelinks.com"),
  SUPPORT_EMAIL: getOptionalEnvVar("SUPPORT_EMAIL", "support@gdsmarriagelinks.com"),
  RAZORPAY_KEY_ID: getOptionalEnvVar("RAZORPAY_KEY_ID", ""),
  RAZORPAY_KEY_SECRET: getOptionalEnvVar("RAZORPAY_KEY_SECRET", ""),
  RAZORPAY_WEBHOOK_SECRET: getOptionalEnvVar("RAZORPAY_WEBHOOK_SECRET", ""),
  UPLOADTHING_TOKEN: getRequiredEnvVar("UPLOADTHING_TOKEN"),
  ADMIN_EMAILS: getOptionalEnvVar("ADMIN_EMAILS", "admin@gdsmarriagelinks.com"),
};

export const clientEnv = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "GDS Marriage Links",
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
};
