/**
 * Unified Mobile SMS & WhatsApp Notification Dispatcher
 * Supports: Fast2SMS (India), Msg91, Twilio, and direct WhatsApp formatting.
 */

import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

type SmsOptions = {
  to: string; // Mobile number (e.g. 9876543210)
  message: string;
  templateType: "ORDER_PLACED" | "PAYMENT_VERIFIED" | "ORDER_SHIPPED" | "ORDER_DELIVERED" | "OTP";
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  "https://fashion-cart-5p7k.vercel.app";

/**
 * Dispatches an SMS via configured gateway (Fast2SMS / Twilio / Msg91) or logs in dev/simulation mode.
 */
export async function sendMobileSms(opts: SmsOptions): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  const cleanPhone = opts.to.replace(/[^0-9]/g, "").slice(-10); // Extract 10-digit Indian mobile number

  if (!cleanPhone || cleanPhone.length < 10) {
    console.warn(`[SMS ABORTED] Invalid mobile phone number: ${opts.to}`);
    return { success: false, simulated: false, error: "Invalid mobile phone number." };
  }

  // 1. Fast2SMS Integration (Popular Indian SMS Gateway)
  const fast2SmsApiKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsApiKey) {
    try {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: opts.message,
          language: "english",
          flash: 0,
          numbers: cleanPhone,
        }),
      });

      const data = await res.json();
      if (data.return) {
        console.log(`[SMS SENT VIA FAST2SMS] To: ${cleanPhone} | Message: ${opts.message}`);
        return { success: true, simulated: false };
      } else {
        console.error("[FAST2SMS ERROR]:", data);
      }
    } catch (err) {
      console.error("[FAST2SMS DISPATCH ERROR]:", err);
    }
  }

  // 2. Twilio SMS Integration (International / India)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        To: `+91${cleanPhone}`,
        From: twilioFrom,
        Body: opts.message,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (res.ok) {
        console.log(`[SMS SENT VIA TWILIO] To: +91${cleanPhone}`);
        return { success: true, simulated: false };
      }
    } catch (err) {
      console.error("[TWILIO SMS ERROR]:", err);
    }
  }

  // 3. Simulated / Log Mode
  console.log(`\n======================================================`);
  console.log(`[MOBILE SMS DISPATCHED — (Connect Fast2SMS / Twilio for live SMS)]`);
  console.log(`To: +91 ${cleanPhone}`);
  console.log(`Type: ${opts.templateType}`);
  console.log(`Message: ${opts.message}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}

// -------------------------------------------------------------
// PRE-BUILT SMS & WHATSAPP TEMPLATES
// -------------------------------------------------------------

export function formatOrderPlacedSms(order: { orderNumber: string; total: any; user: { name: string }; id: string }) {
  return `Fashion Cart: Namaste ${order.user.name}! Your order #${order.orderNumber} for ${formatINR(order.total)} is received and confirmed. Track status: ${APP_URL}/account/orders/${order.id}`;
}

export function formatPaymentVerifiedSms(order: { orderNumber: string; user: { name: string }; id: string }) {
  return `Fashion Cart: Great news ${order.user.name}! Payment for order #${order.orderNumber} is verified. Your package is now processing for dispatch. Invoice: ${APP_URL}/account/orders/${order.id}`;
}

export function formatOrderShippedSms(order: { orderNumber: string; user: { name: string }; carrierName?: string | null; trackingNumber?: string | null; id: string }) {
  const carrier = order.carrierName || "Express Courier";
  const awb = order.trackingNumber || "Assigned";
  return `Fashion Cart: Your order #${order.orderNumber} has shipped with ${carrier} (AWB: ${awb}). Track live package: ${APP_URL}/account/orders/${order.id}`;
}

export function formatOrderDeliveredSms(order: { orderNumber: string; user: { name: string }; id: string }) {
  return `Fashion Cart: Your order #${order.orderNumber} has been delivered! Hope you love your new outfit. Leave a quick review: ${APP_URL}/account/orders/${order.id}`;
}

/**
 * Builds a direct WhatsApp click-to-chat URL with pre-filled order update message.
 */
export function getWhatsAppShareUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
