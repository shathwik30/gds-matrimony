import { describe, it, expect } from "vitest";
import {
  getFirstIncompleteStep,
  isStepComplete,
  STEP_REQUIRED_FIELDS,
} from "@/lib/utils/profile-steps";

describe("STEP_REQUIRED_FIELDS", () => {
  it("has 8 steps defined", () => {
    expect(STEP_REQUIRED_FIELDS).toHaveLength(8);
  });

  it("step 6 (Family Details) has no required fields", () => {
    expect(STEP_REQUIRED_FIELDS[5]).toEqual([]);
  });

  it("step 1 requires basic info fields", () => {
    expect(STEP_REQUIRED_FIELDS[0]).toEqual([
      "firstName",
      "lastName",
      "gender",
      "dateOfBirth",
      "phoneNumber",
    ]);
  });
});

describe("getFirstIncompleteStep", () => {
  it("returns step 1 for an empty profile", () => {
    expect(getFirstIncompleteStep({})).toBe(1);
  });

  it("returns step 1 when basic info is partially filled", () => {
    const data = { firstName: "Rahul", lastName: "" };
    expect(getFirstIncompleteStep(data)).toBe(1);
  });

  it("returns step 2 when step 1 is complete but height is missing", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
    };
    expect(getFirstIncompleteStep(data)).toBe(2);
  });

  it("returns step 3 when steps 1-2 are complete but religion is missing", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
    };
    expect(getFirstIncompleteStep(data)).toBe(3);
  });

  it("returns step 4 when steps 1-3 are complete", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
      religion: "hindu",
      motherTongue: "telugu",
      countryLivingIn: "India",
      residingState: "Telangana",
      residingCity: "Hyderabad",
    };
    expect(getFirstIncompleteStep(data)).toBe(4);
  });

  it("returns step 5 when steps 1-4 are complete", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
      religion: "hindu",
      motherTongue: "telugu",
      countryLivingIn: "India",
      residingState: "Telangana",
      residingCity: "Hyderabad",
      highestEducation: "bachelor's_degree",
    };
    expect(getFirstIncompleteStep(data)).toBe(5);
  });

  it("skips step 6 (no required fields) and returns step 7 when aboutMe is missing", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
      religion: "hindu",
      motherTongue: "telugu",
      countryLivingIn: "India",
      residingState: "Telangana",
      residingCity: "Hyderabad",
      highestEducation: "bachelor's_degree",
      maritalStatus: "never_married",
    };
    expect(getFirstIncompleteStep(data)).toBe(7);
  });

  it("returns step 7 when aboutMe is too short (< 50 chars)", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
      religion: "hindu",
      motherTongue: "telugu",
      countryLivingIn: "India",
      residingState: "Telangana",
      residingCity: "Hyderabad",
      highestEducation: "bachelor's_degree",
      maritalStatus: "never_married",
      aboutMe: "Too short",
    };
    expect(getFirstIncompleteStep(data)).toBe(7);
  });

  it("returns step 8 when aboutMe is valid but profileImage is missing", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
      religion: "hindu",
      motherTongue: "telugu",
      countryLivingIn: "India",
      residingState: "Telangana",
      residingCity: "Hyderabad",
      highestEducation: "bachelor's_degree",
      maritalStatus: "never_married",
      aboutMe:
        "I am a well-settled professional looking for a life partner who shares similar values.",
    };
    expect(getFirstIncompleteStep(data)).toBe(8);
  });

  it("returns 1 when all steps are complete (review mode)", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
      height: 175,
      religion: "hindu",
      motherTongue: "telugu",
      countryLivingIn: "India",
      residingState: "Telangana",
      residingCity: "Hyderabad",
      highestEducation: "bachelor's_degree",
      maritalStatus: "never_married",
      aboutMe:
        "I am a well-settled professional looking for a life partner who shares similar values.",
      profileImage: "https://example.com/photo.jpg",
    };
    expect(getFirstIncompleteStep(data)).toBe(1);
  });

  it("treats null values as incomplete", () => {
    const data = { firstName: null, lastName: null };
    expect(getFirstIncompleteStep(data)).toBe(1);
  });

  it("treats undefined values as incomplete", () => {
    const data = { firstName: undefined };
    expect(getFirstIncompleteStep(data)).toBe(1);
  });
});

describe("isStepComplete", () => {
  it("returns false for empty data on step 1", () => {
    expect(isStepComplete(0, {})).toBe(false);
  });

  it("returns true for step 6 (no required fields) even with empty data", () => {
    expect(isStepComplete(5, {})).toBe(true);
  });

  it("returns true when all required fields for step 1 are filled", () => {
    const data = {
      firstName: "Rahul",
      lastName: "Sharma",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
    };
    expect(isStepComplete(0, data)).toBe(true);
  });

  it("returns false when one required field is empty string", () => {
    const data = {
      firstName: "Rahul",
      lastName: "",
      gender: "male",
      dateOfBirth: new Date("1995-05-15"),
      phoneNumber: "+919876543210",
    };
    expect(isStepComplete(0, data)).toBe(false);
  });

  it("returns false for aboutMe step when text is under 50 chars", () => {
    expect(isStepComplete(6, { aboutMe: "Short text" })).toBe(false);
  });

  it("returns true for aboutMe step when text is 50+ chars", () => {
    const longText = "A".repeat(50);
    expect(isStepComplete(6, { aboutMe: longText })).toBe(true);
  });

  it("returns true for step 2 when height is provided", () => {
    expect(isStepComplete(1, { height: 170 })).toBe(true);
  });

  it("returns true for step 2 when height is 0 (0 is not null/undefined/empty)", () => {
    // 0 passes the check since it's not null, undefined, or ""
    // The Zod schema separately validates min 140
    expect(isStepComplete(1, { height: 0 })).toBe(true);
  });
});
