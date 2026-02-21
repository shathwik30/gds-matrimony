import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, format, parseISO } from "date-fns";
import { capitalCase } from "change-case";
import pluralize from "pluralize";

export { capitalCase, pluralize };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === "string" ? parseISO(dateOfBirth) : dateOfBirth;
  return differenceInYears(new Date(), dob);
}

// Format date for display
export function formatDate(date: string | Date, formatStr: string = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

// Convert height from cm to feet and inches
export function heightToFeetInches(cm: number): string {
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm / 30.48 - feet) * 12);
  return `${feet}'${inches}"`;
}

// Convert height from feet to cm
export function feetToCm(feet: number, inches: number = 0): number {
  return Math.round((feet + inches / 12) * 30.48);
}

// Format currency (Indian Rupees)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format income range
export function formatIncomeRange(income: string): string {
  const incomeMap: Record<string, string> = {
    upto_3: "Upto ₹3 Lakh",
    "3_5": "₹3-5 Lakh",
    "5_7": "₹5-7 Lakh",
    "7_10": "₹7-10 Lakh",
    "10_15": "₹10-15 Lakh",
    "15_20": "₹15-20 Lakh",
    "20_30": "₹20-30 Lakh",
    "30_50": "₹30-50 Lakh",
    "50_75": "₹50-75 Lakh",
    "75_100": "₹75 Lakh - 1 Crore",
    above_100: "Above ₹1 Crore",
  };
  return incomeMap[income] || income;
}

// Get initials from name
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

// Get full name
export function getFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
}

// 20 tracked fields for profile completion — each worth 5%
export const PROFILE_COMPLETION_FIELDS = [
  "firstName", "lastName", "gender", "dateOfBirth",       // Basic (4)
  "height", "weight",                                      // Physical (2)
  "religion", "caste", "motherTongue",                     // Religion (3)
  "countryLivingIn", "residingState", "residingCity",      // Location (3)
  "highestEducation", "occupation", "annualIncome",        // Education & Career (3)
  "maritalStatus",                                         // Lifestyle (1)
  "familyStatus", "familyType",                            // Family (2)
  "profileImage", "aboutMe",                               // Photo & Bio (2)
] as const;

// Calculate profile completion percentage — each field contributes equally (5%)
export function calculateProfileCompletion(profile: Record<string, unknown>): number {
  const hasValue = (field: string) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== "";
  };

  const filledCount = PROFILE_COMPLETION_FIELDS.filter(hasValue).length;
  return Math.round((filledCount / PROFILE_COMPLETION_FIELDS.length) * 100);
}

// Return the list of field keys that are still missing from the profile
export function getMissingProfileFields(profile: Record<string, unknown>): string[] {
  return PROFILE_COMPLETION_FIELDS.filter((field) => {
    const value = profile[field];
    return value === null || value === undefined || value === "";
  });
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return format(d, "dd MMM yyyy");
}

// Alias for formatRelativeTime (for backward compatibility)
export const formatTimeAgo = formatRelativeTime;

// Format last active status for profile display
export function formatLastActive(lastActive: Date | undefined | null, showLastActive?: boolean): string | null {
  if (!lastActive || !showLastActive) return null;
  const hours = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Active now";
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;
  return "Active 7+ days ago";
}

// Generate a shimmer placeholder data URL for Next.js Image blur placeholder
const shimmerSVG = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e8d5c4" offset="20%" />
      <stop stop-color="#f5ebe0" offset="50%" />
      <stop stop-color="#e8d5c4" offset="70%" />
    </linearGradient>
    <filter id="b" x="0" y="0">
      <feGaussianBlur stdDeviation="20" />
    </filter>
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
  </defs>
  <rect width="${w}" height="${h}" fill="#e8d5c4" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" filter="url(#b)" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export function getBlurDataURL(width = 400, height = 500): string {
  return `data:image/svg+xml;base64,${toBase64(shimmerSVG(width, height))}`;
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Please upload a JPEG, PNG, or WebP image" };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "Image size must be less than 5MB" };
  }

  return { valid: true };
}

// Calculate activity score based on last active time
export function calculateActivityScore(lastActive: Date | string | null | undefined): number {
  if (!lastActive) return -25;

  const now = new Date();
  const last = typeof lastActive === "string" ? new Date(lastActive) : lastActive;
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 10;       // Active today
  if (diffDays <= 3) return 5;       // Active within 3 days
  if (diffDays <= 7) return 0;       // Active within a week
  if (diffDays <= 14) return -10;    // Inactive 7-14 days
  if (diffDays <= 30) return -25;    // Inactive 14-30 days
  return -25;                         // Inactive 30+ days
}

// Safely parse session user ID to integer, returns null if invalid
export function parseUserId(id: string | undefined | null): number | null {
  if (!id) return null;
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}
