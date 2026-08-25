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
      const match = content.match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, "m"));
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {}

  return fallback;
}

function getGatewayCredentials() {
  const keyId = getEnvVariable("RAZORPAY_KEY_ID") || getEnvVariable("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  const keySecret = getEnvVariable("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    throw new Error("Payment gateway credentials are not configured.");
  }

  return { keyId, keySecret };
}

function getAuthHeader(keyId: string, keySecret: string): string {
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

export interface GatewayRefundResult {
  success: boolean;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundArn?: string | null;
  speed?: string;
  error?: string;
  raw?: any;
}

/**
 * Initiates an automated source-account refund via the secure payment gateway.
 * For online prepaid transactions (UPI, Cards, NetBanking), this returns the funds
 * directly back to the customer's original payment method / bank account.
 */
export async function initiateGatewayRefund({
  paymentId,
  amountInRupees,
  reason,
  notes = {},
}: {
  paymentId: string;
  amountInRupees: number;
  reason?: string;
  notes?: Record<string, string>;
}): Promise<GatewayRefundResult> {
  try {
    const { keyId, keySecret } = getGatewayCredentials();

    // Gateway expects amount in smallest currency subunit (paise for INR)
    const amountInPaise = Math.round(amountInRupees * 100);

    const payload = {
      amount: amountInPaise,
      speed: "optimum", // Attempts instant refund if supported by customer's bank, otherwise standard
      notes: {
        reason: reason || "Customer requested order cancellation",
        ...notes,
      },
    };

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorDescription = data?.error?.description || "Gateway refund request could not be processed.";
      console.error("[Payment Gateway Refund] Error response:", {
        status: response.status,
        data,
      });
      return {
        success: false,
        error: errorDescription,
        raw: data,
      };
    }

    const refundId = data?.id;
    const refundStatus = (data?.status || "PROCESSED").toUpperCase();
    const refundAmount = data?.amount ? Number(data.amount) / 100 : amountInRupees;
    const refundArn = data?.acquirer_data?.arn || data?.acquirer_data?.rrn || data?.acquirer_data?.bank_transaction_id || null;
    const speed = data?.speed_processed || data?.speed_requested || "normal";

    return {
      success: true,
      refundId,
      refundStatus,
      refundAmount,
      refundArn,
      speed,
      raw: data,
    };
  } catch (err: any) {
    console.error("[Payment Gateway Refund] Exception:", err);
    return {
      success: false,
      error: err.message || "Failed to communicate with payment gateway.",
    };
  }
}
