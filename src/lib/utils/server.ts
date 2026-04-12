import "server-only";
import { randomBytes } from "crypto";

export function generateOTP(length: number = 6): string {
  const bytes = randomBytes(length);
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
}

export function generateId(): string {
  return `${Date.now()}-${randomBytes(6).toString("hex")}`;
}

// Generates a human-readable 12-character secondary password (uppercase + lowercase + digits).
// No special characters so it's easy to share and type.
export function generateSecondaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}
