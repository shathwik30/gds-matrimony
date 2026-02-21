import { db } from "../src/lib/db";
import {
  users,
  profiles,
  partnerPreferences,
  subscriptions,
  interests,
  shortlists,
  profileViews,
  profileSeen,
  profileImages,
  messages,
  messageAttachments,
  typingIndicators,
  conversations,
  blocks,
  reports,
  verifications,
  otps,
  siteSettings,
  contactPackPurchases,
  payments,
  contactSubmissions,
  activityLogs,
} from "../src/lib/db/schema";
import bcrypt from "bcryptjs";

// ── Helpers ──────────────────────────────────────────────────────────

function random<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDOB(minAge: number, maxAge: number): string {
  const today = new Date();
  const age = randomRange(minAge, maxAge);
  const year = today.getFullYear() - age;
  const month = randomRange(0, 11);
  const day = randomRange(1, 28);
  return new Date(year, month, day).toISOString().split("T")[0];
}

function randomSubset<T>(arr: readonly T[] | T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Name Data ────────────────────────────────────────────────────────

const maleFirstNames = [
  "Rahul", "Arjun", "Aditya", "Rohan", "Karthik", "Vikram", "Amit", "Prateek",
  "Siddharth", "Nikhil", "Rajesh", "Suresh", "Ankit", "Varun", "Vishal", "Akash",
  "Harsh", "Kunal", "Ravi", "Ajay", "Deepak", "Manish", "Gaurav", "Abhishek", "Sanjay",
];

const femaleFirstNames = [
  "Priya", "Anjali", "Neha", "Pooja", "Riya", "Shreya", "Ananya", "Divya",
  "Kavya", "Meera", "Sanya", "Tanvi", "Isha", "Aditi", "Nikita", "Sakshi",
  "Simran", "Pallavi", "Swati", "Ritu", "Sneha", "Preeti", "Nisha", "Megha", "Shweta",
];

const lastNames = [
  "Sharma", "Verma", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Iyer",
  "Gupta", "Agarwal", "Jain", "Mehta", "Shah", "Kapoor", "Chopra", "Malhotra",
  "Khanna", "Sethi", "Bhatia", "Rao", "Desai", "Kulkarni", "Joshi", "Saxena", "Trivedi",
];

// ── Religions & Castes (from constants) ──────────────────────────────

const CASTE_MAP: Record<string, string[]> = {
  Hindu: [
    "Brahmin", "Kshatriya", "Vaishya", "Yadav", "Kurmi", "Saini", "Jat",
    "Bania", "Kayastha", "Rajput", "Agarwal", "Gupta", "Maratha", "Nair",
    "Vanniyar", "Lingayat", "Reddy", "Iyer", "Iyengar", "Kamma", "Patel",
    "SC", "ST", "OBC", "Other",
  ],
  Muslim: ["Ansari", "Pathan", "Shaikh", "Siddiqui", "Sayyid", "Qureshi", "Mughal", "Mirza", "Khan", "Chaudhary", "Other"],
  Christian: ["Roman Catholic", "Protestant", "Syrian Christian", "Malankara Orthodox", "Pentecost", "Evangelical", "Anglican", "Baptist", "Methodist", "Presbyterian", "Other"],
  Sikh: ["Jat Sikh", "Khatri Sikh", "Ramgarhia", "Arora", "Mazbi Sikh", "Lubana", "Ahluwalia", "Saini", "Rai Sikh", "Bhatia", "Other"],
  Jain: ["Shwetambar", "Digambar", "Oswal", "Porwal", "Agarwal Jain", "Khandelwal Jain", "Humad", "Other"],
  Buddhist: ["Mahar", "Tibetan Buddhist", "Newar", "Burman", "Bhutia", "Sherpa", "Other"],
  Parsi: ["Irani", "Parsi", "Zoroastrian", "Other"],
};

// ── Location Data (using STATE_OPTIONS values & CITIES_BY_STATE) ─────

const LOCATIONS: { state: string; city: string }[] = [
  { state: "Maharashtra", city: "Mumbai" },
  { state: "Maharashtra", city: "Pune" },
  { state: "Maharashtra", city: "Nagpur" },
  { state: "Karnataka", city: "Bengaluru" },
  { state: "Karnataka", city: "Mysuru" },
  { state: "TamilNadu", city: "Chennai" },
  { state: "TamilNadu", city: "Coimbatore" },
  { state: "Telangana", city: "Hyderabad" },
  { state: "Gujarat", city: "Ahmedabad" },
  { state: "Gujarat", city: "Surat" },
  { state: "Rajasthan", city: "Jaipur" },
  { state: "UttarPradesh", city: "Lucknow" },
  { state: "UttarPradesh", city: "Noida" },
  { state: "WestBengal", city: "Kolkata" },
  { state: "MadhyaPradesh", city: "Indore" },
  { state: "MadhyaPradesh", city: "Bhopal" },
  { state: "Delhi", city: "New Delhi" },
  { state: "Punjab", city: "Ludhiana" },
  { state: "Punjab", city: "Amritsar" },
  { state: "Kerala", city: "Kochi" },
  { state: "Kerala", city: "Thiruvananthapuram" },
  { state: "Haryana", city: "Gurugram" },
  { state: "Bihar", city: "Patna" },
  { state: "AndhraPradesh", city: "Visakhapatnam" },
  { state: "Chandigarh", city: "Chandigarh" },
];

// ── Education, Occupation, Income (from constants) ───────────────────

const EDUCATIONS = [
  "High School", "Diploma", "Bachelor's Degree", "Master's Degree",
  "Doctorate/PhD", "Professional Degree (CA, CS, ICWA)", "Engineering (B.Tech/B.E.)",
  "Engineering (M.Tech/M.E.)", "Medical (MBBS)", "Medical (MD/MS)", "MBA/PGDM",
  "Law (LLB)", "Law (LLM)", "Other",
];

const OCCUPATIONS = [
  "Software Professional", "Banking Professional", "Doctor", "Engineer",
  "Teacher/Professor", "Lawyer", "Chartered Accountant", "Government Employee",
  "Business Owner", "Manager", "Consultant", "Analyst", "Designer",
  "Marketing Professional", "Sales Professional", "HR Professional",
  "Finance Professional", "Medical Professional", "Other",
];

const INCOMES = [
  "upto_3", "3_5", "5_7", "7_10", "10_15", "15_20", "20_30", "30_50", "50_75", "75_100", "above_100",
];

const EMPLOYED_IN = ["Private Sector", "Government/PSU", "Business/Self Employed", "Defense/Civil Services", "Not Working", "Other"];

// ── Lifestyle & Family (from constants) ──────────────────────────────

const MOTHER_TONGUES = ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Marathi", "Punjabi", "Bengali", "Gujarati", "Malayalam", "Odia", "Urdu"];
const DIETS = ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan"];
const SMOKING = ["No", "Yes", "Occasionally"];
const DRINKING = ["No", "Yes", "Occasionally", "Socially"];
const BODY_TYPES = ["Slim", "Average", "Athletic", "Heavy"];
const COMPLEXIONS = ["Very Fair", "Fair", "Wheatish", "Wheatish Brown", "Dark"];
const FAMILY_STATUSES = ["Middle Class", "Upper Middle Class", "Rich", "Affluent"];
const FAMILY_TYPES = ["Joint Family", "Nuclear Family"];
const FAMILY_VALUES = ["Traditional", "Moderate", "Liberal"];
const FATHER_OCCUPATIONS = ["Business Owner", "Government Employee", "Engineer", "Doctor", "Teacher/Professor", "Retired", "Farmer", "Lawyer"];
const MOTHER_OCCUPATIONS = ["Homemaker", "Teacher/Professor", "Doctor", "Government Employee", "Business Owner", "Nurse", "Retired"];
const HOBBIES_LIST = [
  "Reading", "Traveling", "Cooking", "Photography", "Yoga", "Music",
  "Painting", "Gardening", "Swimming", "Dancing", "Hiking", "Cricket",
  "Movies", "Writing", "Meditation", "Badminton", "Cycling", "Chess",
];

const aboutMeTemplates = [
  "I am a simple and down-to-earth person looking for a life partner who shares similar values and interests.",
  "Family-oriented professional seeking a caring and understanding life partner for a meaningful relationship.",
  "Passionate about life and looking forward to meeting someone special to share beautiful moments with.",
  "Believer in traditional values with a modern outlook. Seeking a compatible partner for marriage.",
  "Kind-hearted and ambitious individual looking for a supportive and loving life partner.",
  "Love traveling, reading, and spending quality time with family. Looking for someone with similar interests.",
  "Working professional with strong family values seeking a like-minded partner.",
  "Easy-going person who values honesty and transparency in relationships.",
  "Looking for a life partner who is understanding, caring, and has a good sense of humor.",
  "Ambitious professional seeking a partner to build a beautiful life together.",
];

// ── Religion distribution for 25 profiles ────────────────────────────
// Ensures all religions are represented
const religionDistribution: string[] = [
  // 12 Hindu
  "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu", "Hindu",
  // 4 Muslim
  "Muslim", "Muslim", "Muslim", "Muslim",
  // 3 Christian
  "Christian", "Christian", "Christian",
  // 2 Sikh
  "Sikh", "Sikh",
  // 2 Jain
  "Jain", "Jain",
  // 1 Buddhist
  "Buddhist",
  // 1 Parsi
  "Parsi",
];

// ── Database Clear ───────────────────────────────────────────────────

async function clearDatabase() {
  console.log("Clearing database...");

  // Clear all tables in foreign-key safe order (children before parents)
  await db.delete(activityLogs);
  await db.delete(contactSubmissions);
  await db.delete(contactPackPurchases);
  await db.delete(typingIndicators);
  await db.delete(messageAttachments);
  await db.delete(conversations);
  await db.delete(messages);
  await db.delete(blocks);
  await db.delete(reports);
  await db.delete(verifications);
  await db.delete(otps);
  await db.delete(profileSeen);
  await db.delete(profileViews);
  await db.delete(shortlists);
  await db.delete(interests);
  await db.delete(payments);
  await db.delete(subscriptions);
  await db.delete(profileImages);
  await db.delete(partnerPreferences);
  await db.delete(profiles);
  await db.delete(siteSettings);
  await db.delete(users);

  console.log("Database cleared!");
}

// ── Seed ─────────────────────────────────────────────────────────────

async function seedDatabase() {
  console.log("Starting database seed...");

  const seedPassword = process.env.SEED_PASSWORD || "password123";
  const hashedPassword = await bcrypt.hash(seedPassword, 10);
  const createdUserIds: number[] = [];
  const credentials: Array<{ email: string; name: string; gender: string; role?: string }> = [];

  // ── Admin User ─────────────────────────────────────────────────────
  console.log("Creating admin user...");
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@gdsmarriagelinks.com",
      password: hashedPassword,
      emailVerified: true,
      isActive: true,
      lastActive: new Date(),
    })
    .returning();

  await db.insert(profiles).values({
    userId: admin.id,
    firstName: "Admin",
    lastName: "User",
    gender: "male",
    dateOfBirth: "1990-01-01",
    profileCompletion: 100,
    trustLevel: "highly_trusted",
    trustScore: 100,
  });

  credentials.push({ email: "admin@gdsmarriagelinks.com", name: "Admin User", gender: "admin", role: "admin" });

  // ── Create 25 Male Profiles ────────────────────────────────────────
  console.log("Creating 25 male profiles...");
  const maleReligions = [...religionDistribution].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 25; i++) {
    const firstName = maleFirstNames[i];
    const lastName = lastNames[i];
    const email = `male${i + 1}@test.com`;
    const religion = maleReligions[i];
    const caste = random(CASTE_MAP[religion] || ["Other"]);
    const location = random(LOCATIONS);
    const dob = randomDOB(23, 38);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    createdUserIds.push(user.id);
    credentials.push({ email, name: `${firstName} ${lastName}`, gender: "male" });

    const brothers = randomRange(0, 3);
    const sisters = randomRange(0, 3);

    await db.insert(profiles).values({
      userId: user.id,
      firstName,
      lastName,
      gender: "male",
      dateOfBirth: dob,
      height: randomRange(165, 185),
      weight: randomRange(58, 90),
      bodyType: random(BODY_TYPES),
      complexion: random(COMPLEXIONS),
      physicalStatus: Math.random() > 0.05 ? "Normal" : "Physically Challenged",
      religion,
      caste,
      motherTongue: random(MOTHER_TONGUES),
      countryLivingIn: "India",
      residingState: location.state,
      residingCity: location.city,
      citizenship: "India",
      highestEducation: random(EDUCATIONS),
      employedIn: random(EMPLOYED_IN),
      occupation: random(OCCUPATIONS),
      annualIncome: random(INCOMES),
      maritalStatus: Math.random() > 0.85 ? random(["divorced", "widowed"] as const) : "never_married",
      diet: random(DIETS),
      smoking: random(SMOKING),
      drinking: random(DRINKING),
      hobbies: randomSubset(HOBBIES_LIST, randomRange(2, 5)).join(", "),
      familyStatus: random(FAMILY_STATUSES),
      familyType: random(FAMILY_TYPES),
      familyValue: random(FAMILY_VALUES),
      fatherOccupation: random(FATHER_OCCUPATIONS),
      motherOccupation: random(MOTHER_OCCUPATIONS),
      brothers,
      brothersMarried: randomRange(0, brothers),
      sisters,
      sistersMarried: randomRange(0, sisters),
      aboutMe: random(aboutMeTemplates),
      profileCompletion: randomRange(75, 100),
      trustScore: randomRange(40, 95),
      trustLevel: random(["new_member", "verified_user", "highly_trusted"]),
      hideProfile: false,
    });

    // Partner preferences
    await db.insert(partnerPreferences).values({
      userId: user.id,
      ageMin: randomRange(21, 26),
      ageMax: randomRange(30, 38),
      heightMin: randomRange(150, 158),
      heightMax: randomRange(168, 178),
      religions: [religion],
      educations: randomSubset(EDUCATIONS, 3),
      maritalStatuses: ["never_married"],
    });

    // Subscription: 30% none, 20% basic, 20% silver, 20% gold, 10% platinum
    const roll = Math.random();
    let plan: "basic" | "silver" | "gold" | "platinum" | null = null;
    if (roll < 0.1) plan = "platinum";
    else if (roll < 0.3) plan = "gold";
    else if (roll < 0.5) plan = "silver";
    else if (roll < 0.7) plan = "basic";

    if (plan) {
      const durationDays = plan === "basic" ? 30 : plan === "silver" ? 90 : plan === "gold" ? 180 : 365;
      await db.insert(subscriptions).values({
        userId: user.id,
        plan,
        startDate: new Date(),
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        isActive: true,
        interestsPerDay: plan === "basic" ? 10 : plan === "silver" ? 20 : plan === "gold" ? 50 : 9999,
        contactViews: plan === "basic" ? 10 : plan === "silver" ? 20 : plan === "gold" ? 50 : 9999,
        profileBoosts: plan === "basic" ? 0 : plan === "silver" ? 0 : plan === "gold" ? 1 : 3,
      });
    }

    if ((i + 1) % 5 === 0) console.log(`  Created ${i + 1}/25 male profiles`);
  }

  // ── Create 25 Female Profiles ──────────────────────────────────────
  console.log("Creating 25 female profiles...");
  const femaleReligions = [...religionDistribution].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 25; i++) {
    const firstName = femaleFirstNames[i];
    const lastName = lastNames[i];
    const email = `female${i + 1}@test.com`;
    const religion = femaleReligions[i];
    const caste = random(CASTE_MAP[religion] || ["Other"]);
    const location = random(LOCATIONS);
    const dob = randomDOB(22, 35);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    createdUserIds.push(user.id);
    credentials.push({ email, name: `${firstName} ${lastName}`, gender: "female" });

    const brothers = randomRange(0, 3);
    const sisters = randomRange(0, 3);

    await db.insert(profiles).values({
      userId: user.id,
      firstName,
      lastName,
      gender: "female",
      dateOfBirth: dob,
      height: randomRange(150, 170),
      weight: randomRange(45, 68),
      bodyType: random(BODY_TYPES),
      complexion: random(COMPLEXIONS),
      physicalStatus: Math.random() > 0.05 ? "Normal" : "Physically Challenged",
      religion,
      caste,
      motherTongue: random(MOTHER_TONGUES),
      countryLivingIn: "India",
      residingState: location.state,
      residingCity: location.city,
      citizenship: "India",
      highestEducation: random(EDUCATIONS),
      employedIn: random(EMPLOYED_IN),
      occupation: random(OCCUPATIONS),
      annualIncome: random(INCOMES),
      maritalStatus: Math.random() > 0.9 ? random(["divorced", "widowed"] as const) : "never_married",
      diet: random(DIETS),
      smoking: random(["No", "Occasionally"]),
      drinking: random(["No", "Socially"]),
      hobbies: randomSubset(HOBBIES_LIST, randomRange(2, 5)).join(", "),
      familyStatus: random(FAMILY_STATUSES),
      familyType: random(FAMILY_TYPES),
      familyValue: random(FAMILY_VALUES),
      fatherOccupation: random(FATHER_OCCUPATIONS),
      motherOccupation: random(MOTHER_OCCUPATIONS),
      brothers,
      brothersMarried: randomRange(0, brothers),
      sisters,
      sistersMarried: randomRange(0, sisters),
      aboutMe: random(aboutMeTemplates),
      profileCompletion: randomRange(75, 100),
      trustScore: randomRange(40, 95),
      trustLevel: random(["new_member", "verified_user", "highly_trusted"]),
      hideProfile: false,
    });

    // Partner preferences
    await db.insert(partnerPreferences).values({
      userId: user.id,
      ageMin: randomRange(24, 28),
      ageMax: randomRange(34, 42),
      heightMin: randomRange(165, 172),
      heightMax: randomRange(180, 190),
      religions: [religion],
      educations: randomSubset(EDUCATIONS, 3),
      maritalStatuses: ["never_married"],
    });

    // Subscription
    const roll = Math.random();
    let plan: "basic" | "silver" | "gold" | "platinum" | null = null;
    if (roll < 0.1) plan = "platinum";
    else if (roll < 0.3) plan = "gold";
    else if (roll < 0.5) plan = "silver";
    else if (roll < 0.7) plan = "basic";

    if (plan) {
      const durationDays = plan === "basic" ? 30 : plan === "silver" ? 90 : plan === "gold" ? 180 : 365;
      await db.insert(subscriptions).values({
        userId: user.id,
        plan,
        startDate: new Date(),
        endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
        isActive: true,
        interestsPerDay: plan === "basic" ? 10 : plan === "silver" ? 20 : plan === "gold" ? 50 : 9999,
        contactViews: plan === "basic" ? 10 : plan === "silver" ? 20 : plan === "gold" ? 50 : 9999,
        profileBoosts: plan === "basic" ? 0 : plan === "silver" ? 0 : plan === "gold" ? 1 : 3,
      });
    }

    if ((i + 1) % 5 === 0) console.log(`  Created ${i + 1}/25 female profiles`);
  }

  // ── Create Cross-Interests ─────────────────────────────────────────
  console.log("Creating sample interests...");
  // Male users are indices 0-24, female users are indices 25-49 in createdUserIds
  const interestData: { senderId: number; receiverId: number; status: "pending" | "accepted" | "rejected"; message: string }[] = [];

  // 10 accepted interests (male -> female)
  for (let i = 0; i < 10; i++) {
    interestData.push({
      senderId: createdUserIds[i],
      receiverId: createdUserIds[25 + i],
      status: "accepted",
      message: "I liked your profile and would like to connect.",
    });
  }

  // 8 pending interests (male -> female)
  for (let i = 10; i < 18; i++) {
    interestData.push({
      senderId: createdUserIds[i],
      receiverId: createdUserIds[25 + i],
      status: "pending",
      message: "Hi, I found your profile interesting. Would love to know more about you.",
    });
  }

  // 5 rejected interests
  for (let i = 18; i < 23; i++) {
    interestData.push({
      senderId: createdUserIds[i],
      receiverId: createdUserIds[25 + i],
      status: "rejected",
      message: "Hello, I think we could be a good match.",
    });
  }

  // 5 female -> male interests
  for (let i = 0; i < 5; i++) {
    interestData.push({
      senderId: createdUserIds[25 + 20 + i],
      receiverId: createdUserIds[i + 5],
      status: random(["pending", "accepted"] as const),
      message: "Your profile caught my attention. Let's connect!",
    });
  }

  for (const data of interestData) {
    await db.insert(interests).values({
      senderId: data.senderId,
      receiverId: data.receiverId,
      status: data.status,
      message: data.message,
      respondedAt: data.status !== "pending" ? new Date() : undefined,
    });
  }

  console.log(`  Created ${interestData.length} interests (accepted/pending/rejected)`);

  // ── Print Summary (no credentials) ────────────────────────────────
  console.log("\nDatabase seeded successfully!");
  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY:");
  console.log("  Total Users: 51 (1 admin + 25 male + 25 female)");
  console.log("  Admin:  admin@gdsmarriagelinks.com");
  console.log("  Males:  male1@test.com to male25@test.com");
  console.log("  Females: female1@test.com to female25@test.com");
  console.log("  Religions: Hindu, Muslim, Christian, Sikh, Jain, Buddhist, Parsi");
  console.log("  Subscriptions: ~50% Free, ~20% Silver, ~20% Gold, ~10% Platinum");
  console.log("  Interests: 28 cross-profile interests created");
  console.log("\n  NOTE: All test accounts use the same password (set in SEED_PASSWORD env var or default).");
  console.log("=".repeat(70));
}

async function main() {
  // Guard against running in production
  const dbUrl = process.env.DATABASE_URL || "";
  if (
    process.env.NODE_ENV === "production" ||
    (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1") && !dbUrl.includes("neon.tech"))
  ) {
    console.error("WARNING: Seed script detected a non-local database.");
    console.error("Set NODE_ENV to something other than 'production' and ensure you intend to seed this database.");
    console.error("If you really want to proceed, set SEED_FORCE=1");
    if (!process.env.SEED_FORCE) {
      process.exit(1);
    }
  }

  try {
    if (process.env.SEED_FRESH) {
      await clearDatabase();
    }
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
