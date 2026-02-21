import "server-only";
import { randomBytes } from "crypto";

// Generate cryptographically secure random OTP
export function generateOTP(length: number = 6): string {
  const bytes = randomBytes(length);
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += (bytes[i] % 10).toString();
  }
  return otp;
}

// Generate a unique ID using cryptographic randomness
export function generateId(): string {
  return `${Date.now()}-${randomBytes(6).toString("hex")}`;
}
