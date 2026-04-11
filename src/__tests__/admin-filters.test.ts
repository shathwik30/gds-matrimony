import { describe, it, expect } from "vitest";
import type { AdminUserFilters } from "@/lib/actions/admin";

describe("AdminUserFilters", () => {
  it("supports all expected filter properties", () => {
    const filters: AdminUserFilters = {
      status: "active",
      gender: "male",
      subscription: "gold",
      trustLevel: "verified_user",
      married: "married",
      profileCompletion: "complete",
      emailVerified: "verified",
      subCaste: "iyengar",
      country: "India",
      state: "Telangana",
      birthYearFrom: "1996",
      birthYearTo: "1999",
      sort: "name_asc",
    };

    expect(filters.status).toBe("active");
    expect(filters.gender).toBe("male");
    expect(filters.subscription).toBe("gold");
    expect(filters.trustLevel).toBe("verified_user");
    expect(filters.married).toBe("married");
    expect(filters.profileCompletion).toBe("complete");
    expect(filters.emailVerified).toBe("verified");
    expect(filters.subCaste).toBe("iyengar");
    expect(filters.country).toBe("India");
    expect(filters.state).toBe("Telangana");
    expect(filters.birthYearFrom).toBe("1996");
    expect(filters.birthYearTo).toBe("1999");
    expect(filters.sort).toBe("name_asc");
  });

  it("allows all properties to be undefined", () => {
    const filters: AdminUserFilters = {};
    expect(filters.status).toBeUndefined();
    expect(filters.gender).toBeUndefined();
    expect(filters.subscription).toBeUndefined();
    expect(filters.married).toBeUndefined();
    expect(filters.country).toBeUndefined();
    expect(filters.birthYearFrom).toBeUndefined();
    expect(filters.birthYearTo).toBeUndefined();
  });

  it("accepts all valid status values", () => {
    const active: AdminUserFilters = { status: "active" };
    const inactive: AdminUserFilters = { status: "inactive" };
    expect(active.status).toBe("active");
    expect(inactive.status).toBe("inactive");
  });

  it("accepts all valid subscription values", () => {
    const plans = ["free", "basic", "silver", "gold", "platinum"];
    for (const plan of plans) {
      const f: AdminUserFilters = { subscription: plan };
      expect(f.subscription).toBe(plan);
    }
  });

  it("accepts all valid sort values", () => {
    const sorts = [
      "name_asc",
      "name_desc",
      "oldest",
      "last_active",
      "completion_desc",
      "completion_asc",
    ];
    for (const sort of sorts) {
      const f: AdminUserFilters = { sort };
      expect(f.sort).toBe(sort);
    }
  });

  it("accepts all valid profileCompletion values", () => {
    const values = ["complete", "incomplete", "empty"];
    for (const val of values) {
      const f: AdminUserFilters = { profileCompletion: val };
      expect(f.profileCompletion).toBe(val);
    }
  });

  it("accepts a free-text subCaste filter", () => {
    const f: AdminUserFilters = { subCaste: "iyengar" };
    expect(f.subCaste).toBe("iyengar");
  });

  it("accepts all valid married values", () => {
    const values = ["married", "unmarried"];
    for (const val of values) {
      const f: AdminUserFilters = { married: val };
      expect(f.married).toBe(val);
    }
  });

  it("accepts year strings for birthYearFrom and birthYearTo", () => {
    const f: AdminUserFilters = {
      birthYearFrom: "1996",
      birthYearTo: "1999",
    };
    expect(f.birthYearFrom).toBe("1996");
    expect(f.birthYearTo).toBe("1999");
  });
});
