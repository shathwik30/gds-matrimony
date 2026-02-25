import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, format, parseISO } from "date-fns";
import { capitalCase } from "change-case";
import pluralize from "pluralize";

export { capitalCase, pluralize };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === "string" ? parseISO(dateOfBirth) : dateOfBirth;
  return differenceInYears(new Date(), dob);
}

export function formatDate(date: string | Date, formatStr: string = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

export function heightToFeetInches(cm: number): string {
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm / 30.48 - feet) * 12);
  return `${feet}'${inches}"`;
}

export function feetToCm(feet: number, inches: number = 0): number {
  return Math.round((feet + inches / 12) * 30.48);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatStatNumber(num: number): string {
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}K+` : `${k.toFixed(1)}K+`;
  }
  return `${num}+`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const INCOME_MAP: Record<string, string> = {
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

export function formatIncomeRange(income: string): string {
  return INCOME_MAP[income] || income;
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

export function getFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
}

export const PROFILE_COMPLETION_FIELDS = [
  "firstName",
  "lastName",
  "gender",
  "dateOfBirth",
  "height",
  "weight",
  "religion",
  "caste",
  "motherTongue",
  "countryLivingIn",
  "residingState",
  "residingCity",
  "highestEducation",
  "occupation",
  "annualIncome",
  "maritalStatus",
  "familyStatus",
  "familyType",
  "profileImage",
  "aboutMe",
] as const;

export function calculateProfileCompletion(profile: Record<string, unknown>): number {
  const hasValue = (field: string) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== "";
  };

  const filledCount = PROFILE_COMPLETION_FIELDS.filter(hasValue).length;
  return Math.round((filledCount / PROFILE_COMPLETION_FIELDS.length) * 100);
}

export function getMissingProfileFields(profile: Record<string, unknown>): string[] {
  return PROFILE_COMPLETION_FIELDS.filter((field) => {
    const value = profile[field];
    return value === null || value === undefined || value === "";
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

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

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;
const SECONDS_IN_WEEK = 604800;

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < SECONDS_IN_MINUTE) return "Just now";
  if (diffInSeconds < SECONDS_IN_HOUR)
    return `${Math.floor(diffInSeconds / SECONDS_IN_MINUTE)}m ago`;
  if (diffInSeconds < SECONDS_IN_DAY) return `${Math.floor(diffInSeconds / SECONDS_IN_HOUR)}h ago`;
  if (diffInSeconds < SECONDS_IN_WEEK) return `${Math.floor(diffInSeconds / SECONDS_IN_DAY)}d ago`;

  return format(d, "dd MMM yyyy");
}

export const formatTimeAgo = formatRelativeTime;

export function formatLastActive(
  lastActive: Date | undefined | null,
  showLastActive?: boolean
): string | null {
  if (!lastActive || !showLastActive) return null;
  const hours = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Active now";
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Active ${days}d ago`;
  return "Active 7+ days ago";
}

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
  typeof window === "undefined" ? Buffer.from(str).toString("base64") : window.btoa(str);

export function getBlurDataURL(width = 400, height = 500): string {
  return `data:image/svg+xml;base64,${toBase64(shimmerSVG(width, height))}`;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Please upload a JPEG, PNG, or WebP image" };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image size must be less than 5MB" };
  }

  return { valid: true };
}

export function calculateActivityScore(lastActive: Date | string | null | undefined): number {
  if (!lastActive) return -25;

  const now = new Date();
  const last = typeof lastActive === "string" ? new Date(lastActive) : lastActive;
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 10;
  if (diffDays <= 3) return 5;
  if (diffDays <= 7) return 0;
  if (diffDays <= 14) return -10;
  return -25;
}

export function parseUserId(id: string | undefined | null): number | null {
  if (!id) return null;
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}
