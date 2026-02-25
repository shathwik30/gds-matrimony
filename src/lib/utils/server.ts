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
