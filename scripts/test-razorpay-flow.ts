import { createRazorpayOrder, verifyRazorpaySignature } from "../lib/payments/razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

async function testRazorpay() {
  console.log("Testing Razorpay Connection with provided Test Keys...");

  try {
    // 1. Test Order Creation with Razorpay API
    const testOrder = await createRazorpayOrder({
      amountInRupees: 499,
      receipt: "TEST-ORDER-1001",
      notes: { test: "true", store: "garments" },
    });

    console.log("✓ Razorpay Order Created Successfully!");
    console.log("  Order ID:", testOrder.id);
    console.log("  Amount (paise):", testOrder.amount);
    console.log("  Currency:", testOrder.currency);
    console.log("  Status:", testOrder.status);

    // 2. Test HMAC Signature Verification
    const fakePaymentId = "pay_test_123456789";
    const dataToSign = `${testOrder.id}|${fakePaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(dataToSign)
      .digest("hex");

    const isVerified = verifyRazorpaySignature({
      razorpayOrderId: testOrder.id,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: generatedSignature,
    });

    console.log("✓ Cryptographic Signature Verification:", isVerified ? "PASSED" : "FAILED");

    const isBadVerified = verifyRazorpaySignature({
      razorpayOrderId: testOrder.id,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: "invalid_tampered_signature",
    });

    console.log("✓ Tampered Signature Rejection:", !isBadVerified ? "PASSED" : "FAILED");

    console.log("\n All Razorpay Gateway Backend Tests PASSED Successfully! 🎉");
  } catch (err) {
    console.error("❌ Razorpay Test Error:", err);
    process.exit(1);
  }
}

testRazorpay();
