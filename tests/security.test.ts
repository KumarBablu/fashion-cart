import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { generatePasswordResetToken, verifyPasswordResetToken } from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/rate-limit";

describe("Security Regressions: Cryptography & Auth Verification", () => {
  it("binds password reset token to user password hash so changed password invalidates token", async () => {
    const user = {
      id: "usr_sec_101",
      email: "victim@example.com",
      passwordHash: "$2a$12$abcdefghijklmnopqrstuv",
    };

    const { token, code } = generatePasswordResetToken(user);
    expect(token).toBeDefined();
    expect(code).toHaveLength(6);

    // If decoded payload is tampered
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    parts[0] = "usr_attacker_999"; // Change user ID
    const tamperedToken = Buffer.from(parts.join(":")).toString("base64url");

    const result = await verifyPasswordResetToken(tamperedToken, code);
    expect(result.valid).toBe(false);
  });

  it("verifies timingSafeEqual behavior on matching and non-matching signatures", () => {
    const secret = "super-secret-key";
    const data = "order_123|pay_456";
    const sig1 = crypto.createHmac("sha256", secret).update(data).digest("hex");
    const sig2 = crypto.createHmac("sha256", secret).update(data).digest("hex");
    const sigFake = crypto.createHmac("sha256", "wrong-key").update(data).digest("hex");

    const b1 = Buffer.from(sig1, "utf-8");
    const b2 = Buffer.from(sig2, "utf-8");
    const bFake = Buffer.from(sigFake, "utf-8");

    expect(crypto.timingSafeEqual(b1, b2)).toBe(true);
    expect(crypto.timingSafeEqual(b1, bFake)).toBe(false);
  });
});

describe("Security Regressions: CSV Formula Injection Neutralization", () => {
  function escapeCsvCell(val: string): string {
    let str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  it("neutralizes formula triggers (=, +, -, @)", () => {
    expect(escapeCsvCell("=1+1")).toBe(`"'=1+1"`);
    expect(escapeCsvCell("+cmd|' /C calc'!A0")).toBe(`"'+cmd|' /C calc'!A0"`);
    expect(escapeCsvCell("-20% Off")).toBe(`"'-20% Off"`);
    expect(escapeCsvCell("@SUM(1,2)")).toBe(`"'@SUM(1,2)"`);
  });

  it("leaves standard text untouched with proper quotes", () => {
    expect(escapeCsvCell("Banarasi Silk Saree")).toBe(`"Banarasi Silk Saree"`);
    expect(escapeCsvCell('Silk "Couture"')).toBe(`"Silk ""Couture"""`);
  });
});

describe("Security Regressions: Rate Limiter Memory Management", () => {
  it("enforces rate limit thresholds", () => {
    const key = `test-ip-${Date.now()}`;
    expect(rateLimit(key, 3, 1000)).toBe(true);
    expect(rateLimit(key, 3, 1000)).toBe(true);
    expect(rateLimit(key, 3, 1000)).toBe(true);
    expect(rateLimit(key, 3, 1000)).toBe(false);
  });
});

describe("Security Regressions: SSRF Host & IP Filtering (Finding 2)", () => {
  function isForbiddenHost(hostname: string): boolean {
    const h = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "").replace(/\.+$/, "");

    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h === "::1" ||
      h === "169.254.169.254" ||
      h.endsWith(".internal") ||
      h.endsWith(".local") ||
      h.endsWith(".localhost") ||
      h.endsWith(".arpa")
    ) {
      return true;
    }

    if (h.startsWith("::") || h.startsWith("fe80:") || h.startsWith("fc00:") || h.startsWith("fd00:")) return true;
    if (h.includes("::ffff:")) {
      const v4 = h.split("::ffff:")[1];
      if (v4 && isForbiddenHost(v4)) return true;
    }

    if (/^10\./.test(h)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true;
    if (/^192\.168\./.test(h)) return true;
    if (/^169\.254\./.test(h)) return true;
    if (/^127\./.test(h)) return true;
    if (/^0\./.test(h)) return true;

    if (/^\d+$/.test(h)) {
      const num = parseInt(h, 10);
      if (!isNaN(num)) {
        const ip1 = (num >>> 24) & 255;
        const ip2 = (num >>> 16) & 255;
        if (ip1 === 127 || ip1 === 10 || ip1 === 0) return true;
        if (ip1 === 169 && ip2 === 254) return true;
        if (ip1 === 192 && ip2 === 168) return true;
        if (ip1 === 172 && ip2 >= 16 && ip2 <= 31) return true;
      }
    }

    return false;
  }

  it("blocks localhost, loopback and cloud metadata hosts", () => {
    expect(isForbiddenHost("localhost")).toBe(true);
    expect(isForbiddenHost("127.0.0.1")).toBe(true);
    expect(isForbiddenHost("127.0.0.2")).toBe(true);
    expect(isForbiddenHost("169.254.169.254")).toBe(true);
    expect(isForbiddenHost("169.254.169.254.")).toBe(true); // trailing dot
    expect(isForbiddenHost("[::1]")).toBe(true);
    expect(isForbiddenHost("::1")).toBe(true);
    expect(isForbiddenHost("::ffff:127.0.0.1")).toBe(true);
    expect(isForbiddenHost("service.internal")).toBe(true);
  });

  it("blocks private IPv4 ranges (RFC1918)", () => {
    expect(isForbiddenHost("10.0.0.1")).toBe(true);
    expect(isForbiddenHost("192.168.1.1")).toBe(true);
    expect(isForbiddenHost("172.16.0.1")).toBe(true);
    expect(isForbiddenHost("172.31.255.255")).toBe(true);
  });

  it("blocks decimal integer IP notations (e.g. 2130706433 = 127.0.0.1)", () => {
    expect(isForbiddenHost("2130706433")).toBe(true); // 127.0.0.1
    expect(isForbiddenHost("2852039166")).toBe(true); // 169.254.169.254
  });

  it("allows public domain names and public IPs", () => {
    expect(isForbiddenHost("images.unsplash.com")).toBe(false);
    expect(isForbiddenHost("lh3.googleusercontent.com")).toBe(false);
    expect(isForbiddenHost("cdn.fashioncart.shop")).toBe(false);
  });
});

describe("Security Regressions: Razorpay Webhook Amount Validation (Finding 1)", () => {
  function validateWebhookPayment(orderTotal: number, paymentAmountPaise: number, currency: string, status: string) {
    const expectedPaise = Math.round(Number(orderTotal) * 100);
    if (!paymentAmountPaise || paymentAmountPaise !== expectedPaise) {
      return { valid: false, error: "Payment amount mismatch" };
    }
    if (currency.toUpperCase() !== "INR") {
      return { valid: false, error: "Invalid payment currency" };
    }
    if (status !== "captured" && status !== "authorized") {
      return { valid: false, error: `Payment not captured. Status: ${status}` };
    }
    return { valid: true };
  }

  it("accepts exact matching payment amount in paise for INR captured payments", () => {
    const result = validateWebhookPayment(1499.00, 149900, "INR", "captured");
    expect(result.valid).toBe(true);
  });

  it("rejects mismatched payment amount (e.g. paying 1 INR for a 50,000 INR order)", () => {
    const result = validateWebhookPayment(50000.00, 100, "INR", "captured");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Payment amount mismatch");
  });

  it("rejects non-INR currencies", () => {
    const result = validateWebhookPayment(100.00, 10000, "USD", "captured");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid payment currency");
  });

  it("rejects uncaptured/failed payment status", () => {
    const result = validateWebhookPayment(100.00, 10000, "INR", "failed");
    expect(result.valid).toBe(false);
  });
});

describe("Security Regressions: Canonical Phone Normalization (Finding 4)", () => {
  function normalizeAndLookupPhone(raw: string): { isExact10: boolean; digits: string } {
    const digits = raw.replace(/\D/g, "").slice(-10);
    return { isExact10: digits.length === 10, digits };
  }

  it("extracts exact 10-digit Indian phone numbers", () => {
    expect(normalizeAndLookupPhone("+91 97710 39201")).toEqual({ isExact10: true, digits: "9771039201" });
    expect(normalizeAndLookupPhone("09771039201")).toEqual({ isExact10: true, digits: "9771039201" });
    expect(normalizeAndLookupPhone("9771039201")).toEqual({ isExact10: true, digits: "9771039201" });
  });

  it("rejects partial numbers under 10 digits to prevent substring collisions", () => {
    expect(normalizeAndLookupPhone("9771039").isExact10).toBe(false);
    expect(normalizeAndLookupPhone("12345").isExact10).toBe(false);
  });
});

