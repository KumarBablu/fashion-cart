import { describe, it, expect } from "vitest";
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  orderPlacedEmailTemplate,
  orderShippedEmailTemplate,
  contactInquiryEmailTemplate,
} from "@/lib/email/templates";

describe("Email Templates", () => {
  it("renders welcome email template with name and welcome coupon", () => {
    const html = welcomeEmailTemplate("Asha Verma");
    expect(html).toContain("Asha Verma");
    expect(html).toContain("FIRST10");
    expect(html).toContain("Fashion Cart");
  });

  it("renders password reset template with recovery link and 6-digit code", () => {
    const html = passwordResetEmailTemplate("Asha Verma", "/reset-password?token=abc123xyz", "582914");
    expect(html).toContain("Asha Verma");
    expect(html).toContain("582914");
    expect(html).toContain("/reset-password?token=abc123xyz");
  });

  it("renders password changed notification email", () => {
    const html = passwordChangedEmailTemplate("Asha Verma");
    expect(html).toContain("Password Updated");
    expect(html).toContain("Asha Verma");
  });

  it("renders order placed email template with items breakdown", () => {
    const mockOrder = {
      id: "ord_123",
      orderNumber: "FC-2026-9021",
      subtotal: 1299,
      discount: 200,
      deliveryCharge: 0,
      total: 1099,
      paymentMethod: "MANUAL_UPI",
      status: "PENDING_PAYMENT",
      user: { name: "Asha Verma", email: "asha@example.com" },
      shippingAddressSnapshot: {
        fullName: "Asha Verma",
        mobileNumber: "9876543210",
        addressLine1: "123 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pinCode: "560001",
      },
      items: [
        {
          productNameSnapshot: "Classic Oxford Cotton Shirt",
          colourSnapshot: "Sky Blue",
          sizeSnapshot: "M",
          quantity: 1,
          unitPrice: 1299,
          total: 1299,
        },
      ],
    };

    const html = orderPlacedEmailTemplate(mockOrder);
    expect(html).toContain("FC-2026-9021");
    expect(html).toContain("Classic Oxford Cotton Shirt");
    expect(html).toContain("Sky Blue");
    expect(html).toContain("₹1,099");
  });

  it("renders order shipped template with tracking number", () => {
    const mockOrder = {
      id: "ord_123",
      orderNumber: "FC-2026-9021",
      subtotal: 1299,
      discount: 0,
      deliveryCharge: 0,
      total: 1299,
      paymentMethod: "COD",
      status: "SHIPPED",
      user: { name: "Asha Verma", email: "asha@example.com" },
      shippingAddressSnapshot: {
        fullName: "Asha Verma",
        mobileNumber: "9876543210",
        addressLine1: "123 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pinCode: "560001",
      },
      items: [],
    };

    const html = orderShippedEmailTemplate(mockOrder, "BlueDart", "BD9827391823");
    expect(html).toContain("FC-2026-9021");
    expect(html).toContain("BlueDart");
    expect(html).toContain("BD9827391823");
  });

  it("renders contact form inquiry template", () => {
    const html = contactInquiryEmailTemplate("Rahul", "rahul@example.com", "Bulk Order Sizing", "Need 20 shirts for event");
    expect(html).toContain("Rahul");
    expect(html).toContain("rahul@example.com");
    expect(html).toContain("Bulk Order Sizing");
    expect(html).toContain("Need 20 shirts for event");
  });
});
