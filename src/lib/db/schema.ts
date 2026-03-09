import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  pgEnum,
  json,
  decimal,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const genderEnum = pgEnum("gender", ["male", "female"]);
export const maritalStatusEnum = pgEnum("marital_status", [
  "never_married",
  "divorced",
  "widowed",
  "awaiting_divorce",
]);
export const profileForEnum = pgEnum("profile_for", [
  "myself",
  "son",
  "daughter",
  "brother",
  "sister",
  "friend",
]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "basic",
  "silver",
  "gold",
  "platinum",
]);
export const interestStatusEnum = pgEnum("interest_status", ["pending", "accepted", "rejected"]);
export const trustLevelEnum = pgEnum("trust_level", [
  "new_member",
  "verified_user",
  "highly_trusted",
]);
export const purchaseTypeEnum = pgEnum("purchase_type", [
  "subscription",
  "contact_pack_10",
  "contact_pack_25",
  "contact_pack_50",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "staff"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    emailVerified: boolean("email_verified").default(false),
    phoneNumber: varchar("phone_number", { length: 20 }),
    secondaryPhoneNumber: varchar("secondary_phone_number", { length: 20 }),
    phoneVerified: boolean("phone_verified").default(false),
    profileFor: profileForEnum("profile_for").default("myself"),
    role: userRoleEnum("role").default("user"),
    createdByStaffId: integer("created_by_staff_id"),
    isActive: boolean("is_active").default(true),
    lastActive: timestamp("last_active"),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_phone_idx").on(table.phoneNumber),
    index("users_last_active_idx").on(table.lastActive),
    index("users_is_active_idx").on(table.isActive),
    index("users_role_idx").on(table.role),
    index("users_created_by_staff_idx").on(table.createdByStaffId),
  ]
);

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    gender: genderEnum("gender"),
    dateOfBirth: date("date_of_birth"),

    height: integer("height"),
    weight: integer("weight"),
    bodyType: varchar("body_type", { length: 50 }),
    complexion: varchar("complexion", { length: 50 }),
    physicalStatus: varchar("physical_status", { length: 100 }),

    religion: varchar("religion", { length: 100 }),
    caste: varchar("caste", { length: 100 }),
    subCaste: varchar("sub_caste", { length: 100 }),
    motherTongue: varchar("mother_tongue", { length: 100 }),
    gothra: varchar("gothra", { length: 100 }),

    countryLivingIn: varchar("country_living_in", { length: 100 }),
    residingState: varchar("residing_state", { length: 100 }),
    residingCity: varchar("residing_city", { length: 100 }),
    citizenship: varchar("citizenship", { length: 100 }),

    highestEducation: varchar("highest_education", { length: 100 }),
    educationDetail: text("education_detail"),
    employedIn: varchar("employed_in", { length: 100 }),
    occupation: varchar("occupation", { length: 100 }),
    jobTitle: varchar("job_title", { length: 100 }),
    annualIncome: varchar("annual_income", { length: 100 }),

    maritalStatus: maritalStatusEnum("marital_status"),
    diet: varchar("diet", { length: 50 }),
    smoking: varchar("smoking", { length: 50 }),
    drinking: varchar("drinking", { length: 50 }),
    hobbies: text("hobbies"),

    familyStatus: varchar("family_status", { length: 100 }),
    familyType: varchar("family_type", { length: 50 }),
    familyValue: varchar("family_value", { length: 100 }),
    fatherOccupation: varchar("father_occupation", { length: 100 }),
    motherOccupation: varchar("mother_occupation", { length: 100 }),
    brothers: integer("brothers"),
    brothersMarried: integer("brothers_married"),
    sisters: integer("sisters"),
    sistersMarried: integer("sisters_married"),

    aboutMe: text("about_me"),

    profileImage: text("profile_image"),
    profileCompletion: integer("profile_completion").default(0),
    trustScore: integer("trust_score").default(0),
    trustLevel: trustLevelEnum("trust_level").default("new_member"),

    notificationPrefs: json("notification_prefs").$type<{
      email: boolean;
      interests: boolean;
      messages: boolean;
      matches: boolean;
    }>(),

    hideProfile: boolean("hide_profile").default(false),
    showOnlineStatus: boolean("show_online_status").default(true),
    showLastActive: boolean("show_last_active").default(true),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("profiles_user_id_idx").on(table.userId),
    index("profiles_gender_idx").on(table.gender),
    index("profiles_religion_idx").on(table.religion),
    index("profiles_state_idx").on(table.residingState),
    index("profiles_hide_profile_idx").on(table.hideProfile),
    index("profiles_trust_level_idx").on(table.trustLevel),
    index("profiles_completion_idx").on(table.profileCompletion),
  ]
);

export const profileImages = pgTable(
  "profile_images",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    imageUrl: text("image_url").notNull(),
    isPrimary: boolean("is_primary").default(false),
    isVerified: boolean("is_verified").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("profile_images_profile_idx").on(table.profileId)]
);

export const partnerPreferences = pgTable("partner_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  ageMin: integer("age_min"),
  ageMax: integer("age_max"),

  heightMin: integer("height_min"),
  heightMax: integer("height_max"),

  religions: json("religions").$type<string[]>(),
  castes: json("castes").$type<string[]>(),
  motherTongues: json("mother_tongues").$type<string[]>(),

  countries: json("countries").$type<string[]>(),
  states: json("states").$type<string[]>(),
  cities: json("cities").$type<string[]>(),

  educations: json("educations").$type<string[]>(),
  occupations: json("occupations").$type<string[]>(),
  incomeMin: varchar("income_min", { length: 50 }),
  incomeMax: varchar("income_max", { length: 50 }),

  maritalStatuses: json("marital_statuses").$type<string[]>(),
  diets: json("diets").$type<string[]>(),
  smoking: varchar("smoking", { length: 50 }),
  drinking: varchar("drinking", { length: 50 }),

  aboutPartner: text("about_partner"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    plan: subscriptionPlanEnum("plan").default("free"),
    startDate: timestamp("start_date").defaultNow(),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").default(true),

    interestsPerDay: integer("interests_per_day").default(5),
    contactViews: integer("contact_views").default(0),
    profileBoosts: integer("profile_boosts").default(0),

    interestsSentToday: integer("interests_sent_today").default(0),
    contactViewsUsed: integer("contact_views_used").default(0),
    boostsUsed: integer("boosts_used").default(0),

    lastBoostAt: timestamp("last_boost_at"),
    boostExpiresAt: timestamp("boost_expires_at"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("subscriptions_user_idx").on(table.userId),
    index("subscriptions_active_idx").on(table.userId, table.isActive),
    index("subscriptions_expiry_idx").on(table.userId, table.endDate),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    subscriptionId: integer("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),

    razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
    razorpaySignature: text("razorpay_signature"),

    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("INR"),
    status: varchar("status", { length: 50 }).default("pending"),
    plan: subscriptionPlanEnum("plan"),
    purchaseType: purchaseTypeEnum("purchase_type"),
    contactPackSize: integer("contact_pack_size"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("payments_user_idx").on(table.userId),
    index("payments_order_idx").on(table.razorpayOrderId),
    uniqueIndex("payments_razorpay_payment_id_idx").on(table.razorpayPaymentId),
    index("payments_status_idx").on(table.status),
    index("payments_subscription_idx").on(table.subscriptionId),
  ]
);

export const interests = pgTable(
  "interests",
  {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: integer("receiver_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: interestStatusEnum("status").default("pending"),
    message: text("message"),
    isSuperInterest: boolean("is_super_interest").default(false),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("interests_sender_idx").on(table.senderId),
    index("interests_receiver_idx").on(table.receiverId),
    index("interests_status_idx").on(table.status),
    uniqueIndex("interests_unique_idx").on(table.senderId, table.receiverId),
  ]
);

export const shortlists = pgTable(
  "shortlists",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    shortlistedUserId: integer("shortlisted_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("shortlists_user_idx").on(table.userId),
    index("shortlists_shortlisted_user_idx").on(table.shortlistedUserId),
    uniqueIndex("shortlists_unique_idx").on(table.userId, table.shortlistedUserId),
  ]
);

export const profileViews = pgTable(
  "profile_views",
  {
    id: serial("id").primaryKey(),
    viewerId: integer("viewer_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    viewedUserId: integer("viewed_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    viewedAt: timestamp("viewed_at").defaultNow(),
  },
  (table) => [
    index("profile_views_viewer_idx").on(table.viewerId),
    index("profile_views_viewed_idx").on(table.viewedUserId),
    index("profile_views_viewer_recent_idx").on(table.viewerId, table.viewedAt),
  ]
);

export const profileSeen = pgTable(
  "profile_seen",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    seenUserId: integer("seen_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lastSeen: timestamp("last_seen").defaultNow(),
    matchScore: integer("match_score").default(0),
    viewCount: integer("view_count").default(1),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("profile_seen_unique_idx").on(table.userId, table.seenUserId),
    index("profile_seen_user_idx").on(table.userId),
    index("profile_seen_last_seen_idx").on(table.userId, table.lastSeen),
    index("profile_seen_seen_user_idx").on(table.seenUserId),
  ]
);

export const messageStatusEnum = pgEnum("message_status", ["pending", "sent", "delivered", "read"]);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: integer("receiver_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    hasAttachment: boolean("has_attachment").default(false),
    status: messageStatusEnum("status").default("sent").notNull(),
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("messages_sender_idx").on(table.senderId),
    index("messages_receiver_idx").on(table.receiverId),
    index("messages_created_idx").on(table.createdAt),
    index("messages_status_idx").on(table.status),
    index("messages_receiver_unread_idx").on(table.receiverId, table.isRead),
  ]
);

export const messageAttachments = pgTable(
  "message_attachments",
  {
    id: serial("id").primaryKey(),
    messageId: integer("message_id")
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    attachmentUrl: text("attachment_url").notNull(),
    attachmentType: varchar("attachment_type", { length: 50 }).default("image"),
    fileName: varchar("file_name", { length: 255 }),
    fileSize: integer("file_size"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("message_attachments_message_idx").on(table.messageId)]
);

export const typingIndicators = pgTable(
  "typing_indicators",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lastTypingAt: timestamp("last_typing_at").defaultNow(),
  },
  (table) => [uniqueIndex("typing_indicator_unique").on(table.conversationId, table.userId)]
);

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    user1Id: integer("user1_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    user2Id: integer("user2_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lastMessageId: integer("last_message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    lastMessageAt: timestamp("last_message_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("conversations_unique_idx").on(table.user1Id, table.user2Id),
    index("conversations_user1_idx").on(table.user1Id),
    index("conversations_user2_idx").on(table.user2Id),
    index("conversations_last_msg_at_idx").on(table.lastMessageAt),
  ]
);

export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    blockerId: integer("blocker_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    blockedUserId: integer("blocked_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("blocks_unique_idx").on(table.blockerId, table.blockedUserId),
    index("blocks_blocked_user_idx").on(table.blockedUserId),
  ]
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    reporterId: integer("reporter_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    reportedUserId: integer("reported_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 50 }).default("pending"),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("reports_reporter_idx").on(table.reporterId),
    index("reports_reported_idx").on(table.reportedUserId),
    index("reports_status_idx").on(table.status),
  ]
);

export const verifications = pgTable(
  "verifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    documentUrl: text("document_url"),
    status: verificationStatusEnum("status").default("pending"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("verifications_user_idx").on(table.userId),
    index("verifications_status_idx").on(table.status),
    index("verifications_type_idx").on(table.type),
  ]
);

export const otps = pgTable(
  "otps",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 10 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    isUsed: boolean("is_used").default(false),
    attempts: integer("attempts").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("otps_email_idx").on(table.email),
    index("otps_email_type_idx").on(table.email, table.type),
    index("otps_expires_at_idx").on(table.expiresAt),
  ]
);

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactPackPurchases = pgTable(
  "contact_pack_purchases",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    paymentId: integer("payment_id").references(() => payments.id, { onDelete: "set null" }),
    packSize: integer("pack_size").notNull(),
    contactsRemaining: integer("contacts_remaining").notNull(),
    purchasedAt: timestamp("purchased_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("contact_packs_user_idx").on(table.userId),
    index("contact_packs_payment_idx").on(table.paymentId),
    index("contact_packs_expires_at_idx").on(table.expiresAt),
  ]
);

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 50 }).default("unread"),
    adminNotes: text("admin_notes"),
    repliedAt: timestamp("replied_at"),
    repliedBy: integer("replied_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("contact_submissions_status_idx").on(table.status),
    index("contact_submissions_created_idx").on(table.createdAt),
  ]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "set null" }),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("activity_logs_user_idx").on(table.userId),
    index("activity_logs_created_at_idx").on(table.createdAt),
    index("activity_logs_action_date_idx").on(table.action, table.createdAt),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  preferences: one(partnerPreferences, {
    fields: [users.id],
    references: [partnerPreferences.userId],
  }),
  subscriptions: many(subscriptions),
  payments: many(payments),
  sentInterests: many(interests, { relationName: "sentInterests" }),
  receivedInterests: many(interests, { relationName: "receivedInterests" }),
  shortlists: many(shortlists),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  createdByStaff: one(users, {
    fields: [users.createdByStaffId],
    references: [users.id],
    relationName: "staffCreatedUsers",
  }),
  createdUsers: many(users, { relationName: "staffCreatedUsers" }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  images: many(profileImages),
}));

export const interestsRelations = relations(interests, ({ one }) => ({
  sender: one(users, {
    fields: [interests.senderId],
    references: [users.id],
    relationName: "sentInterests",
  }),
  receiver: one(users, {
    fields: [interests.receiverId],
    references: [users.id],
    relationName: "receivedInterests",
  }),
  fromProfile: one(profiles, {
    fields: [interests.senderId],
    references: [profiles.userId],
  }),
  toProfile: one(profiles, {
    fields: [interests.receiverId],
    references: [profiles.userId],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const shortlistsRelations = relations(shortlists, ({ one }) => ({
  user: one(users, {
    fields: [shortlists.userId],
    references: [users.id],
  }),
  shortlistedUser: one(users, {
    fields: [shortlists.shortlistedUserId],
    references: [users.id],
  }),
}));

export const profileImagesRelations = relations(profileImages, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileImages.profileId],
    references: [profiles.id],
  }),
}));

export const partnerPreferencesRelations = relations(partnerPreferences, ({ one }) => ({
  user: one(users, {
    fields: [partnerPreferences.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type PartnerPreference = typeof partnerPreferences.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type ProfileSeen = typeof profileSeen.$inferSelect;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type TypingIndicator = typeof typingIndicators.$inferSelect;
export type ContactPackPurchase = typeof contactPackPurchases.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
