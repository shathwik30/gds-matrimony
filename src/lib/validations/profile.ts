import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { calculateAge } from "@/lib/utils";

// Reusable Indian phone number validator
export const indianPhoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || isValidPhoneNumber(val, "IN"),
    "Please enter a valid Indian phone number (+91 or 10 digits)"
  );

export const basicInfoSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  gender: z.enum(["male", "female"], {
    message: "Please select your gender",
  }),
  dateOfBirth: z.date({
    message: "Date of birth is required",
  }).refine((date) => {
    return calculateAge(date) >= 18;
  }, "You must be at least 18 years old")
  .refine((date) => {
    return date <= new Date();
  }, "Date of birth cannot be in the future"),
  phoneNumber: z
    .string()
    .min(1, "Mobile number is required")
    .refine((val) => isValidPhoneNumber(val, "IN"), "Please enter a valid Indian mobile number"),
  secondaryPhoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val, "IN"),
      "Please enter a valid Indian mobile number"
    ),
});

export const physicalDetailsSchema = z.object({
  height: z.number().min(140, "Height must be at least 140 cm").max(213, "Height must be less than 213 cm"),
  weight: z.number().min(30, "Weight must be at least 30 kg").max(200, "Weight must be less than 200 kg").optional(),
  bodyType: z.string().optional(),
  complexion: z.string().optional(),
  physicalStatus: z.string().optional(),
});

export const religionLocationSchema = z.object({
  religion: z.string().min(1, "Religion is required"),
  caste: z.string().optional(),
  subCaste: z.string().optional(),
  motherTongue: z.string().min(1, "Mother tongue is required"),
  gothra: z.string().optional(),
  countryLivingIn: z.string().min(1, "Country is required"),
  residingState: z.string().min(1, "State is required"),
  residingCity: z.string().min(1, "City is required"),
  citizenship: z.string().optional(),
});

export const educationCareerSchema = z.object({
  highestEducation: z.string().min(1, "Education is required"),
  educationDetail: z.string().optional(),
  employedIn: z.string().optional(),
  occupation: z.string().optional(),
  jobTitle: z.string().optional(),
  annualIncome: z.string().optional(),
});

export const lifestyleSchema = z.object({
  maritalStatus: z.enum(["never_married", "divorced", "widowed", "awaiting_divorce"], {
    message: "Marital status is required",
  }),
  diet: z.string().optional(),
  smoking: z.string().optional(),
  drinking: z.string().optional(),
  hobbies: z.string().optional(),
});

export const familyDetailsSchema = z.object({
  familyStatus: z.string().optional(),
  familyType: z.string().optional(),
  familyValue: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  brothers: z.number().min(0).max(10).optional(),
  brothersMarried: z.number().min(0).max(10).optional(),
  sisters: z.number().min(0).max(10).optional(),
  sistersMarried: z.number().min(0).max(10).optional(),
}).refine((data) => {
  if (data.brothers != null && data.brothersMarried != null) {
    return data.brothersMarried <= data.brothers;
  }
  return true;
}, {
  message: "Married brothers cannot exceed total brothers",
  path: ["brothersMarried"],
}).refine((data) => {
  if (data.sisters != null && data.sistersMarried != null) {
    return data.sistersMarried <= data.sisters;
  }
  return true;
}, {
  message: "Married sisters cannot exceed total sisters",
  path: ["sistersMarried"],
});

export const aboutMeSchema = z.object({
  aboutMe: z
    .string()
    .min(50, "About me should be at least 50 characters")
    .max(2000, "About me should be less than 2000 characters"),
});

// Combined profile schema
export const profileSchema = basicInfoSchema
  .merge(physicalDetailsSchema)
  .merge(religionLocationSchema)
  .merge(educationCareerSchema)
  .merge(lifestyleSchema)
  .merge(familyDetailsSchema)
  .merge(aboutMeSchema);

// Partner preferences schema
export const partnerPreferencesSchema = z.object({
  ageMin: z.number().min(18, "Minimum age must be at least 18").max(70),
  ageMax: z.number().min(18).max(70, "Maximum age must be less than 70"),
  heightMin: z.number().min(140).max(220).optional(),
  heightMax: z.number().min(140).max(220).optional(),
  religions: z.array(z.string()).optional(),
  castes: z.array(z.string()).optional(),
  motherTongues: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  educations: z.array(z.string()).optional(),
  occupations: z.array(z.string()).optional(),
  incomeMin: z.string().optional(),
  incomeMax: z.string().optional(),
  maritalStatuses: z.array(z.string()).optional(),
  diets: z.array(z.string()).optional(),
  smoking: z.string().optional(),
  drinking: z.string().optional(),
  aboutPartner: z.string().max(1000).optional(),
}).refine((data) => data.ageMax >= data.ageMin, {
  message: "Maximum age must be greater than minimum age",
  path: ["ageMax"],
}).refine((data) => {
  if (data.heightMin != null && data.heightMax != null) {
    return data.heightMax >= data.heightMin;
  }
  return true;
}, {
  message: "Maximum height must be greater than minimum height",
  path: ["heightMax"],
});

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
export type PhysicalDetailsInput = z.infer<typeof physicalDetailsSchema>;
export type ReligionLocationInput = z.infer<typeof religionLocationSchema>;
export type EducationCareerInput = z.infer<typeof educationCareerSchema>;
export type LifestyleInput = z.infer<typeof lifestyleSchema>;
export type FamilyDetailsInput = z.infer<typeof familyDetailsSchema>;
export type AboutMeInput = z.infer<typeof aboutMeSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PartnerPreferencesInput = z.infer<typeof partnerPreferencesSchema>;
