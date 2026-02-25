import type { User, Profile, Message } from "@/lib/db/schema";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  profileCompleted: boolean;
  subscriptionPlan: "free" | "basic" | "silver" | "gold" | "platinum";
}

export interface UserProfile extends Profile {
  user?: User;
  age?: number;
}

export interface ProfileWithUser {
  profile: Profile;
  user: User;
  matchScore?: number;
}

export interface MatchProfile {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  gender: "male" | "female" | null;
  dateOfBirth: string | null;
  age: number;
  height: number | null;
  religion: string | null;
  caste: string | null;
  motherTongue: string | null;
  residingCity: string | null;
  residingState: string | null;
  highestEducation: string | null;
  occupation: string | null;
  annualIncome: string | null;
  profileImage: string | null;
  aboutMe: string | null;
  profileCompletion: number;
  trustLevel: "new_member" | "verified_user" | "highly_trusted" | null;
  matchScore: number;
  isOnline?: boolean;
  lastActive?: Date;
  email?: string;
  phoneNumber?: string;
  isSuperInterest?: boolean;
  isAadhaarVerified?: boolean;
  subscriptionPlan?: "free" | "basic" | "silver" | "gold" | "platinum";
  showLastActive?: boolean;
  showOnlineStatus?: boolean;
  canViewPhoto?: boolean;
  isBoosted?: boolean;
  images?: { id: number; imageUrl: string; sortOrder: number | null }[];
}

export interface InterestWithProfile {
  id: number;
  status: "pending" | "accepted" | "rejected" | null;
  createdAt: Date | null;
  profile: {
    id: number;
    userId: number;
    firstName: string | null;
    lastName: string | null;
    gender: "male" | "female" | null;
    dateOfBirth: string | null;
    age: number;
    height: number | null;
    religion: string | null;
    caste: string | null;
    residingCity: string | null;
    residingState: string | null;
    highestEducation: string | null;
    occupation: string | null;
    profileImage: string | null;
    profileCompletion: number;
    trustLevel: "new_member" | "verified_user" | "highly_trusted" | null;
    lastActive?: Date;
  };
}

export interface MessageWithSender extends Message {
  sender?: {
    id: number;
    profile?: {
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
    };
  };
}

export interface Conversation {
  id: number;
  otherUser: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    isOnline?: boolean;
  };
  lastMessage?: {
    content: string;
    createdAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface SubscriptionPlan {
  id: "free" | "basic" | "silver" | "gold" | "platinum";
  name: string;
  price: number;
  duration: number; // in months
  features: {
    browseProfiles: boolean;
    viewPhotos: boolean | "blurred";
    interestsPerDay: number;
    contactViews: number;
    chat: boolean | "mutual_only";
    seeProfileViewers: boolean;
    seeWhoLiked: boolean;
    support: "basic" | "standard" | "priority" | "premium";
    profileBoosts: number;
    featuredBadge: boolean;
  };
}

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface RegisterFormData {
  profileFor: "myself" | "son" | "daughter" | "brother" | "sister" | "friend";
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface PreferenceFormData {
  ageMin: number;
  ageMax: number;
  heightMin?: number;
  heightMax?: number;
  religions?: string[];
  castes?: string[];
  motherTongues?: string[];
  countries?: string[];
  states?: string[];
  cities?: string[];
  educations?: string[];
  occupations?: string[];
  incomeMin?: string;
  incomeMax?: string;
  maritalStatuses?: string[];
  diets?: string[];
  smoking?: string;
  drinking?: string;
  aboutPartner?: string;
}

export interface SearchFilters {
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  religion?: string[];
  caste?: string[];
  motherTongue?: string[];
  education?: string[];
  profession?: string[];
  income?: string[];
  maritalStatus?: string[];
  diet?: string[];
  state?: string[];
  city?: string[];
  physicalStatus?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface DashboardStats {
  profileViews: number;
  todayViews: number;
  profilesViewedByMe: number;
  todayViewsByMe: number;
  interestsSent: number;
  interestsReceived: number;
  acceptedInterests: number;
  pendingInterests: number;
  shortlisted: number;
  unreadMessages: number;
}

export interface Notification {
  id: number;
  type: "interest_received" | "interest_accepted" | "new_message" | "profile_view" | "match";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  fromUser?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}
