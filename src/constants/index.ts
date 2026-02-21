import type { SubscriptionPlan } from "@/types";
import { City } from "country-state-city";

// Mapping from camelCase state keys to ISO codes (for country-state-city library)
const STATE_TO_ISO: Record<string, string> = {
  AndhraPradesh: "AP",
  ArunachalPradesh: "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CT",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  HimachalPradesh: "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  MadhyaPradesh: "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OR",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  TamilNadu: "TN",
  Telangana: "TG",
  Tripura: "TR",
  UttarPradesh: "UP",
  Uttarakhand: "UT",
  WestBengal: "WB",
  Delhi: "DL",
  JammuKashmir: "JK",
  Ladakh: "LA",
  Puducherry: "PY",
  Chandigarh: "CH",
};

// Site Configuration - centralized contact info
export const SITE_CONFIG = {
  name: "GDS Marriage Links",
  url: "https://gdsmarriagelinks.com",
  supportEmail: "support@gdsmarriagelinks.com",
  legalEmail: "legal@gdsmarriagelinks.com",
  privacyEmail: "privacy@gdsmarriagelinks.com",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 98765 43210",
  phoneHref: process.env.NEXT_PUBLIC_SUPPORT_PHONE_HREF || "tel:+919876543210",
  address: process.env.NEXT_PUBLIC_OFFICE_ADDRESS || "Mumbai, Maharashtra, India",
  workingHours: "Mon - Sat: 9:00 AM - 6:00 PM",
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "",
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "",
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "",
  },
} as const;

// Profile For Options
export const PROFILE_FOR_OPTIONS = [
  { value: "myself", label: "Myself" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "brother", label: "Brother" },
  { value: "sister", label: "Sister" },
  { value: "friend", label: "Friend" },
] as const;

// Gender Options
export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

// Age Options (18-70)
export const AGE_OPTIONS = Array.from({ length: 53 }, (_, i) => i + 18);

// Marital Status Options
export const MARITAL_STATUS_OPTIONS = [
  { value: "never_married", label: "Never Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "awaiting_divorce", label: "Awaiting Divorce" },
] as const;

// Religion Options
export const RELIGION_OPTIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Jain",
  "Buddhist",
  "Parsi",
  "Jewish",
  "Other",
] as const;

// Caste Options by Religion
export const CASTE_OPTIONS: Record<string, string[]> = {
  Hindu: [
    "Brahmin", "Kshatriya", "Vaishya", "Yadav", "Kurmi", "Saini", "Jat",
    "Bania", "Kayastha", "Rajput", "Agarwal", "Gupta", "Maratha", "Nair",
    "Vanniyar", "Lingayat", "Reddy", "Iyer", "Iyengar", "Kamma", "Patel",
    "SC", "ST", "OBC", "Other"
  ],
  Muslim: [
    "Ansari", "Pathan", "Shaikh", "Siddiqui", "Sayyid", "Qureshi",
    "Mughal", "Mirza", "Khan", "Chaudhary", "Other"
  ],
  Christian: [
    "Roman Catholic", "Protestant", "Syrian Christian", "Malankara Orthodox",
    "Pentecost", "Evangelical", "Anglican", "Baptist", "Methodist", "Presbyterian", "Other"
  ],
  Sikh: [
    "Jat Sikh", "Khatri Sikh", "Ramgarhia", "Arora", "Mazbi Sikh",
    "Lubana", "Ahluwalia", "Saini", "Rai Sikh", "Bhatia", "Other"
  ],
  Jain: [
    "Shwetambar", "Digambar", "Oswal", "Porwal", "Agarwal Jain",
    "Khandelwal Jain", "Humad", "Other"
  ],
  Buddhist: ["Mahar", "Tibetan Buddhist", "Newar", "Burman", "Bhutia", "Sherpa", "Other"],
  Parsi: ["Irani", "Parsi", "Zoroastrian", "Other"],
  Jewish: ["Bene Israel", "Baghdadi", "Cochin", "Other"],
  Other: ["Other"],
};

// Mother Tongue Options
export const MOTHER_TONGUE_OPTIONS = [
  "Hindi", "English", "Tamil", "Telugu", "Kannada", "Marathi", "Punjabi",
  "Bengali", "Gujarati", "Malayalam", "Odia", "Urdu", "Nepali", "Assamese",
  "Kashmiri", "Sindhi", "Konkani", "Marwari", "Sanskrit", "Manipuri", "Maithili",
  "Chhattisgarhi", "Tulu", "Santhali", "Haryanvi", "Bihari", "Rajasthani", "Other"
] as const;

// Height Options (in cm)
export const HEIGHT_OPTIONS = Array.from({ length: 51 }, (_, i) => {
  const cm = 140 + i;
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm / 30.48 - feet) * 12);
  return {
    value: cm,
    label: `${feet}'${inches}" (${cm} cm)`,
  };
});

// Body Type Options
export const BODY_TYPE_OPTIONS = [
  "Slim", "Average", "Athletic", "Heavy", "Other"
] as const;

// Complexion Options
export const COMPLEXION_OPTIONS = [
  "Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"
] as const;

// Physical Status Options
export const PHYSICAL_STATUS_OPTIONS = [
  "Normal", "Physically Challenged"
] as const;

// Education Options
export const EDUCATION_OPTIONS = [
  "High School", "Diploma", "Bachelor's Degree", "Master's Degree",
  "Doctorate/PhD", "Professional Degree (CA, CS, ICWA)", "Engineering (B.Tech/B.E.)",
  "Engineering (M.Tech/M.E.)", "Medical (MBBS)", "Medical (MD/MS)", "MBA/PGDM",
  "Law (LLB)", "Law (LLM)", "Other"
] as const;

// Employed In Options
export const EMPLOYED_IN_OPTIONS = [
  "Private Sector", "Government/PSU", "Business/Self Employed",
  "Defense/Civil Services", "Not Working", "Other"
] as const;

// Occupation Options
export const OCCUPATION_OPTIONS = [
  "Software Professional", "Banking Professional", "Doctor", "Engineer",
  "Teacher/Professor", "Lawyer", "Chartered Accountant", "Government Employee",
  "Business Owner", "Manager", "Consultant", "Analyst", "Designer",
  "Marketing Professional", "Sales Professional", "HR Professional",
  "Finance Professional", "Medical Professional", "Other"
] as const;

// Annual Income Options
export const ANNUAL_INCOME_OPTIONS = [
  { value: "upto_3", label: "Upto 3 Lakh" },
  { value: "3_5", label: "3-5 Lakh" },
  { value: "5_7", label: "5-7 Lakh" },
  { value: "7_10", label: "7-10 Lakh" },
  { value: "10_15", label: "10-15 Lakh" },
  { value: "15_20", label: "15-20 Lakh" },
  { value: "20_30", label: "20-30 Lakh" },
  { value: "30_50", label: "30-50 Lakh" },
  { value: "50_75", label: "50-75 Lakh" },
  { value: "75_100", label: "75 Lakh - 1 Crore" },
  { value: "above_100", label: "Above 1 Crore" },
] as const;

// Diet Options
export const DIET_OPTIONS = [
  "Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan"
] as const;

// Smoking Options
export const SMOKING_OPTIONS = [
  "No", "Yes", "Occasionally"
] as const;

// Drinking Options
export const DRINKING_OPTIONS = [
  "No", "Yes", "Occasionally", "Socially"
] as const;

// Family Status Options
export const FAMILY_STATUS_OPTIONS = [
  "Middle Class", "Upper Middle Class", "Rich", "Affluent"
] as const;

// Family Type Options
export const FAMILY_TYPE_OPTIONS = [
  "Joint Family", "Nuclear Family"
] as const;

// Family Value Options
export const FAMILY_VALUE_OPTIONS = [
  "Traditional", "Moderate", "Liberal"
] as const;

// Parent Occupation Options
export const PARENT_OCCUPATION_OPTIONS = [
  "Government Employee", "Private Employee", "Business", "Professional",
  "Retired", "Homemaker", "Not Employed", "Passed Away"
] as const;

// Countries
export const COUNTRY_OPTIONS = [
  { value: "India", label: "India" },
  { value: "Other", label: "Other" },
] as const;

// Indian States
export const STATE_OPTIONS = [
  { value: "AndhraPradesh", label: "Andhra Pradesh" },
  { value: "ArunachalPradesh", label: "Arunachal Pradesh" },
  { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Haryana", label: "Haryana" },
  { value: "HimachalPradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Kerala", label: "Kerala" },
  { value: "MadhyaPradesh", label: "Madhya Pradesh" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" },
  { value: "Mizoram", label: "Mizoram" },
  { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" },
  { value: "Punjab", label: "Punjab" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" },
  { value: "TamilNadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" },
  { value: "UttarPradesh", label: "Uttar Pradesh" },
  { value: "Uttarakhand", label: "Uttarakhand" },
  { value: "WestBengal", label: "West Bengal" },
  { value: "Delhi", label: "Delhi" },
  { value: "JammuKashmir", label: "Jammu & Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
  { value: "Puducherry", label: "Puducherry" },
  { value: "Chandigarh", label: "Chandigarh" },
] as const;

// Cities by State - lazily computed from country-state-city library per state
const citiesCache: Record<string, string[]> = {};
export const CITIES_BY_STATE: Record<string, string[]> = new Proxy(citiesCache, {
  get(target, prop: string) {
    if (prop in target) return target[prop];
    const isoCode = STATE_TO_ISO[prop];
    if (!isoCode) return undefined;
    const cities = City.getCitiesOfState("IN", isoCode).map((c) => c.name).sort();
    target[prop] = cities;
    return cities;
  },
  has(_target, prop: string) {
    return prop in STATE_TO_ISO;
  },
  ownKeys() {
    return Object.keys(STATE_TO_ISO);
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    if (prop in STATE_TO_ISO) {
      return { configurable: true, enumerable: true, writable: true };
    }
    return undefined;
  },
});

// GST rate (18%)
export const GST_RATE = 0.18;

// Subscription Plans (prices are base prices before GST)
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 2167,
    duration: 1,
    features: {
      browseProfiles: true,
      viewPhotos: true,
      interestsPerDay: 10,
      contactViews: 10,
      chat: "mutual_only",
      seeProfileViewers: false,
      seeWhoLiked: false,
      support: "standard",
      profileBoosts: 0,
      featuredBadge: false,
    },
  },
  {
    id: "silver",
    name: "Silver",
    price: 6499,
    duration: 3,
    features: {
      browseProfiles: true,
      viewPhotos: true,
      interestsPerDay: 20,
      contactViews: 20,
      chat: "mutual_only",
      seeProfileViewers: true,
      seeWhoLiked: false,
      support: "standard",
      profileBoosts: 0,
      featuredBadge: false,
    },
  },
  {
    id: "gold",
    name: "Gold",
    price: 8999,
    duration: 6,
    features: {
      browseProfiles: true,
      viewPhotos: true,
      interestsPerDay: 50,
      contactViews: 50,
      chat: true,
      seeProfileViewers: true,
      seeWhoLiked: true,
      support: "priority",
      profileBoosts: 1,
      featuredBadge: false,
    },
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 10999,
    duration: 12,
    features: {
      browseProfiles: true,
      viewPhotos: true,
      interestsPerDay: 9999, // Unlimited
      contactViews: 9999, // Unlimited
      chat: true,
      seeProfileViewers: true,
      seeWhoLiked: true,
      support: "premium",
      profileBoosts: 3,
      featuredBadge: true,
    },
  },
];

// Profile Completion Steps
export const PROFILE_COMPLETION_STEPS = [
  { step: 1, name: "Basic Info", percentage: 10 },
  { step: 2, name: "Personal Details", percentage: 30 },
  { step: 3, name: "Religion & Location", percentage: 50 },
  { step: 4, name: "Education & Career", percentage: 70 },
  { step: 5, name: "Family Details", percentage: 85 },
  { step: 6, name: "Photo & Bio", percentage: 100 },
] as const;

// Trust Level Thresholds
export const TRUST_LEVEL_THRESHOLDS = {
  new_member: { min: 0, max: 39 },
  verified_user: { min: 40, max: 69 },
  highly_trusted: { min: 70, max: 100 },
} as const;

// Polling Intervals (in milliseconds)
export const POLLING_INTERVALS = {
  CONVERSATIONS: 30000, // 30 seconds
  MESSAGES: 10000, // 10 seconds
} as const;

// OTP Configuration
export const OTP_CONFIG = {
  MAX_ATTEMPTS: 5,
  EXPIRY_MINUTES: 10,
  RESEND_COOLDOWN_SECONDS: 60,
} as const;

// Contact Pack Options
export const CONTACT_PACKS = [
  {
    id: "contact_pack_10",
    size: 10,
    price: 499,
    name: "Starter Pack",
    pricePerContact: 49.90,
    savings: undefined,
    description: "Perfect for exploring a few promising matches"
  },
  {
    id: "contact_pack_25",
    size: 25,
    price: 999,
    name: "Value Pack",
    pricePerContact: 39.96,
    savings: "20%",
    description: "Best value for active matchmaking"
  },
  {
    id: "contact_pack_50",
    size: 50,
    price: 1799,
    name: "Premium Pack",
    pricePerContact: 35.98,
    savings: "30%",
    description: "Maximum connections for serious seekers"
  },
] as const;
