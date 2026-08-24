import crypto from "crypto";

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  error_code?: string;
  error_description?: string;
  created_at: number;
}

/**
 * Retrieves and validates Razorpay configuration credentials.
 */
export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay API credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing from environment variables."
    );
  }

  return { keyId, keySecret };
}

/**
 * Creates an authorized Basic Auth header for Razorpay REST APIs.
 */
function getAuthHeader(keyId: string, keySecret: string): string {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Creates an official order on Razorpay servers.
 * @param amountInRupees Total amount in INR. Converted to paise (1 INR = 100 paise).
 * @param receipt Unique internal order reference number.
 * @param notes Optional metadata notes.
 */
export async function createRazorpayOrder({
  amountInRupees,
  receipt,
  currency = "INR",
  notes = {},
}: {
  amountInRupees: number;
  receipt: string;
  currency?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayCredentials();

  // Razorpay amounts are represented in the smallest currency unit (paise for INR)
  const amountInPaise = Math.round(amountInRupees * 100);

  const payload = {
    amount: amountInPaise,
    currency,
    receipt,
    notes,
    payment_capture: 1, // Auto-capture payment upon authorization
  };

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(keyId, keySecret),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.description || "Failed to initiate Razorpay order.";
    throw new Error(`Razorpay Error (${response.status}): ${errorMsg}`);
  }

  return data as RazorpayOrderResponse;
}

/**
 * Cryptographically verifies Razorpay payment signature returned to the frontend.
 * Uses HMAC-SHA256 of `razorpay_order_id + "|" + razorpay_payment_id` against `RAZORPAY_KEY_SECRET`.
 */
export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  try {
    const { keySecret } = getRazorpayCredentials();
    const dataToSign = `${razorpayOrderId}|${razorpayPaymentId}`;

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(dataToSign)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(razorpaySignature, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error("Razorpay signature verification error:", err);
    return false;
  }
}

/**
 * Validates the authenticity of an incoming Razorpay webhook event using HMAC-SHA256.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string;
  secret?: string;
}): boolean {
  try {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) return false;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const actualBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

/**
 * Fetches the verified payment object directly from Razorpay API.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentDetails> {
  const { keyId, keySecret } = getRazorpayCredentials();

  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(keyId, keySecret),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.description || "Failed to fetch Razorpay payment.";
    throw new Error(`Razorpay Payment Fetch Error: ${errorMsg}`);
  }

  return data as RazorpayPaymentDetails;
}
