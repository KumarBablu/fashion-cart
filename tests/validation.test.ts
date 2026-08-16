import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  addressSchema,
  utrSubmissionSchema,
  variantSchema,
  profileUpdateSchema,
  checkoutSchema,
} from "@/lib/validation/schemas";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Asha Verma",
      email: "asha@example.com",
      phone: "9876543210",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({
      name: "Asha Verma",
      email: "asha@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Asha Verma",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a non-empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts valid profile updates", () => {
    const result = profileUpdateSchema.safeParse({
      name: "Asha Sharma",
      email: "asha.new@example.com",
      phone: "9876543210",
    });
    expect(result.success).toBe(true);
  });

  it("accepts profile updates with new password", () => {
    const result = profileUpdateSchema.safeParse({
      name: "Asha Sharma",
      email: "asha.new@example.com",
      currentPassword: "oldpassword123",
      newPassword: "newpassword123",
    });
    expect(result.success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  it("accepts checkout with addressId, coupon, and payment method", () => {
    const result = checkoutSchema.safeParse({
      addressId: "addr_123",
      couponCode: "FIRST10",
      paymentMethod: "COD",
    });
    expect(result.success).toBe(true);
  });
});

describe("addressSchema", () => {
  it("accepts a complete valid address", () => {
    const result = addressSchema.safeParse({
      fullName: "Asha Verma",
      mobileNumber: "9876543210",
      addressLine1: "123 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid PIN code", () => {
    const result = addressSchema.safeParse({
      fullName: "Asha Verma",
      mobileNumber: "9876543210",
      addressLine1: "123 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "ABCDE",
    });
    expect(result.success).toBe(false);
  });
});

describe("utrSubmissionSchema", () => {
  it("rejects a UTR that is too short", () => {
    const result = utrSubmissionSchema.safeParse({ utrNumber: "12" });
    expect(result.success).toBe(false);
  });

  it("accepts a plausible UTR", () => {
    const result = utrSubmissionSchema.safeParse({ utrNumber: "312345678901" });
    expect(result.success).toBe(true);
  });
});

describe("variantSchema", () => {
  it("rejects negative stock", () => {
    const result = variantSchema.safeParse({
      sku: "SKU-1",
      colour: "Blue",
      size: "M",
      price: 500,
      stockQuantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid variant", () => {
    const result = variantSchema.safeParse({
      sku: "SKU-1",
      colour: "Blue",
      size: "M",
      price: 500,
      stockQuantity: 10,
    });
    expect(result.success).toBe(true);
  });
});
