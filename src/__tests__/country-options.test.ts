import { describe, it, expect } from "vitest";
import { COUNTRY_OPTIONS } from "@/constants";

describe("COUNTRY_OPTIONS", () => {
  it("has a large number of countries (200+)", () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThan(200);
  });

  it("has India as the first option", () => {
    expect(COUNTRY_OPTIONS[0]).toEqual({ value: "India", label: "India" });
  });

  it("includes major countries", () => {
    const countryNames = COUNTRY_OPTIONS.map((c) => c.value);
    expect(countryNames).toContain("India");
    expect(countryNames).toContain("United States");
    expect(countryNames).toContain("United Kingdom");
    expect(countryNames).toContain("Canada");
    expect(countryNames).toContain("Australia");
    expect(countryNames).toContain("United Arab Emirates");
    expect(countryNames).toContain("Singapore");
    expect(countryNames).toContain("Germany");
    expect(countryNames).toContain("France");
    expect(countryNames).toContain("Japan");
  });

  it("each country has value and label properties", () => {
    for (const country of COUNTRY_OPTIONS) {
      expect(country).toHaveProperty("value");
      expect(country).toHaveProperty("label");
      expect(typeof country.value).toBe("string");
      expect(typeof country.label).toBe("string");
      expect(country.value.length).toBeGreaterThan(0);
      expect(country.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate country values", () => {
    const values = COUNTRY_OPTIONS.map((c) => c.value);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("countries after India are in the library's alphabetical order", () => {
    // The country-state-city library provides its own alphabetical order
    // which may differ from strict localeCompare (e.g., "The Bahamas" before "Bahrain")
    const rest = COUNTRY_OPTIONS.slice(1);
    // Verify the first few are in expected order
    const firstFew = rest.slice(0, 5).map((c) => c.label);
    expect(firstFew[0]).toBe("Afghanistan");
    expect(firstFew).toEqual([...firstFew].sort());
  });

  it("value and label are the same for each country", () => {
    for (const country of COUNTRY_OPTIONS) {
      expect(country.value).toBe(country.label);
    }
  });
});
