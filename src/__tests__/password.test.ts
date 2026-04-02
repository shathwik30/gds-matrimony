import { describe, it, expect } from "vitest";
import { generateStrongPassword } from "@/lib/utils/password";

describe("generateStrongPassword", () => {
  it("generates a 12-character password", () => {
    const pw = generateStrongPassword();
    expect(pw).toHaveLength(12);
  });

  it("contains at least one uppercase letter", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw).toMatch(/[A-Z]/);
    }
  });

  it("contains at least one lowercase letter", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw).toMatch(/[a-z]/);
    }
  });

  it("contains at least one digit", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw).toMatch(/[0-9]/);
    }
  });

  it("contains at least one special character", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw).toMatch(/[@#$%&*!?]/);
    }
  });

  it("only contains allowed characters", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw).toMatch(/^[A-Za-z0-9@#$%&*!?]+$/);
    }
  });

  it("excludes ambiguous characters (0, O, 1, l, I)", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateStrongPassword();
      expect(pw).not.toMatch(/[0OlI1]/);
    }
  });

  it("generates unique passwords each time", () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 50; i++) {
      passwords.add(generateStrongPassword());
    }
    // With 12-char passwords from a large charset, collisions are astronomically unlikely
    expect(passwords.size).toBe(50);
  });

  it("satisfies the app registration schema requirements", () => {
    // The registerSchema requires: 8+ chars, letters, numbers, special char
    for (let i = 0; i < 20; i++) {
      const pw = generateStrongPassword();
      expect(pw.length).toBeGreaterThanOrEqual(8);
      expect(pw).toMatch(/[a-zA-Z]/); // has letters
      expect(pw).toMatch(/[0-9]/); // has numbers
      expect(pw).toMatch(/[^a-zA-Z0-9]/); // has special char
    }
  });
});
