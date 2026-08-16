import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generatePasswordResetToken, generateRecoveryCode } from "@/lib/auth/password-reset";

describe("password hashing", () => {
  it("hashes a password to something other than the plain text", async () => {
    const hash = await hashPassword("SuperSecret123");
    expect(hash).not.toBe("SuperSecret123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("SuperSecret123");
    expect(await verifyPassword("SuperSecret123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("SuperSecret123");
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("produces different hashes for the same password (unique salt)", async () => {
    const hash1 = await hashPassword("SuperSecret123");
    const hash2 = await hashPassword("SuperSecret123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("password reset & account retrieval", () => {
  it("generates a valid reset token with payload and signature", () => {
    const mockUser = {
      id: "usr_123",
      email: "test@example.com",
      passwordHash: "$2a$12$eImiTXuWVxfM37uY4JANjOL.oDRrpx7S1kR6Tep8d8b9d62R0Y2bC",
    };
    const { token, expiresAt } = generatePasswordResetToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("generates a 6-digit numeric recovery code", () => {
    const code = generateRecoveryCode("test@example.com");
    expect(code).toMatch(/^\d{6}$/);
  });
});
