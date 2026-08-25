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

import fs from "fs";
import path from "path";

/**
 * Dynamically resolves environment variables with direct .env file fallback.
 */
function getEnvVariable(key: string, fallback?: string): string | undefined {
  if (process.env[key]) return process.env[key];

  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(new RegExp(`^${key}=["']?([^"'\r\n]+)["']?`, "m"));
      if (match && match[1]) {
        const val = match[1].trim();
        process.env[key] = val;
        return val;
      }
    }
  } catch {
    // Ignore filesystem read errors in restricted environments
  }

  return fallback;
}

/**
 * Retrieves and validates Razorpay configuration credentials.
 */
export function getRazorpayCredentials() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    getEnvVariable("RAZORPAY_KEY_ID") ||
    getEnvVariable("NEXT_PUBLIC_RAZORPAY_KEY_ID");

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET ||
    getEnvVariable("RAZORPAY_KEY_SECRET");

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

const INDIAN_BANK_NAMES: Record<string, string> = {
  SBIN: "State Bank of India",
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  BARB_R: "Bank of Baroda",
  PUNB_R: "Punjab National Bank",
  CNRB: "Canara Bank",
  KKBK: "Kotak Mahindra Bank",
  UBIN: "Union Bank of India",
  IDFB: "IDFC FIRST Bank",
  YESB: "Yes Bank",
  INDB: "IndusInd Bank",
  MAHB: "Bank of Maharashtra",
  IOBA: "Indian Overseas Bank",
  CBIN: "Central Bank of India",
  VIJB: "Vijaya Bank",
  SYNB: "Syndicate Bank",
  ANDB: "Andhra Bank",
  CORP: "Corporation Bank",
  ALLA: "Allahabad Bank",
  ORBC: "Oriental Bank of Commerce",
};

/**
 * Parses and formats gateway, payment channel, and specific instrument details
 * (UPI App / ID, Card network & last 4 digits, Netbanking Bank name, Wallet, etc.)
 */
export function parseRazorpayPaymentInstrument(payment: any): {
  gatewayName: string;
  paymentChannel: string;
  instrumentDetails: string;
} {
  const gatewayName = "Razorpay";
  if (!payment) {
    return {
      gatewayName,
      paymentChannel: "ONLINE_GATEWAY",
      instrumentDetails: "Razorpay Gateway",
    };
  }

  const method = String(payment.method || "").toLowerCase();

  if (method === "upi") {
    const vpa = payment.vpa || "";
    let app = "UPI";
    const vpaLower = vpa.toLowerCase();
    if (vpaLower.includes("okhdfcbank") || vpaLower.includes("okaxis") || vpaLower.includes("okicici") || vpaLower.includes("oksbi")) {
      app = "Google Pay";
    } else if (vpaLower.includes("ybl") || vpaLower.includes("ibl") || vpaLower.includes("axl")) {
      app = "PhonePe";
    } else if (vpaLower.includes("paytm")) {
      app = "Paytm UPI";
    } else if (vpaLower.includes("apl")) {
      app = "Amazon Pay UPI";
    } else if (vpaLower.includes("cred")) {
      app = "CRED UPI";
    }
    return {
      gatewayName,
      paymentChannel: "UPI",
      instrumentDetails: vpa ? `${app} (${vpa})` : "UPI App",
    };
  }

  if (method === "card") {
    const card = payment.card || {};
    const network = card.network || "Card";
    const type = card.type ? card.type.toUpperCase() : "CARD";
    const last4 = card.last4 ? `•••• ${card.last4}` : "";
    const issuer = card.issuer ? `(${card.issuer})` : "";
    return {
      gatewayName,
      paymentChannel: `${network} ${type}`,
      instrumentDetails: `${network} Card ${last4} ${issuer}`.trim(),
    };
  }

  if (method === "netbanking") {
    const bankCode = String(payment.bank || "").toUpperCase();
    const bankName = INDIAN_BANK_NAMES[bankCode] || bankCode || "Netbanking";
    return {
      gatewayName,
      paymentChannel: "NETBANKING",
      instrumentDetails: bankName,
    };
  }

  if (method === "wallet") {
    const wallet = payment.wallet || "Wallet";
    return {
      gatewayName,
      paymentChannel: "WALLET",
      instrumentDetails: `${wallet.toUpperCase()} Digital Wallet`,
    };
  }

  if (method === "paylater") {
    return {
      gatewayName,
      paymentChannel: "PAY LATER",
      instrumentDetails: "Razorpay Pay Later",
    };
  }

  return {
    gatewayName,
    paymentChannel: method ? method.toUpperCase() : "ONLINE_GATEWAY",
    instrumentDetails: payment.description || "Razorpay Online Payment",
  };
}
