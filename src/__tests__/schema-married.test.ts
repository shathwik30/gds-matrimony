import { describe, it, expect } from "vitest";
import { profiles } from "@/lib/db/schema";

describe("profiles schema - isMarried field", () => {
  it("has isMarried column defined", () => {
    expect(profiles.isMarried).toBeDefined();
  });

  it("isMarried column has the correct name", () => {
    expect(profiles.isMarried.name).toBe("is_married");
  });

  it("isMarried column exists alongside hideProfile", () => {
    expect(profiles.hideProfile).toBeDefined();
    expect(profiles.isMarried).toBeDefined();
  });
});
