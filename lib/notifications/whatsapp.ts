/**
 * 100% Free & Zero-Cost WhatsApp Communication & Notification Engine
 * Provides pre-formatted rich messages and instant wa.me click-to-chat dispatchers.
 */

import { formatINR } from "@/lib/format";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  "https://fashion-cart-5p7k.vercel.app";

export const BOUTIQUE_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "919771039201";

/**
 * Clean phone number to standard international format (e.g. 919876543210)
 */
export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return BOUTIQUE_PHONE;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Builds a direct wa.me click-to-chat URL with encoded text.
 */
export function createWhatsAppUrl(phone: string, text: string): string {
  const targetPhone = formatWhatsAppPhone(phone);
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text.trim())}`;
}

// -------------------------------------------------------------
// 1. Universal Customer Inquiry & Concierge WhatsApp Message
// -------------------------------------------------------------
export function getCustomerInquiryWhatsAppMessage(params: {
  userName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  pageTitle?: string | null;
  pageUrl?: string | null;
  productName?: string | null;
  productPrice?: number | null;
  productSku?: string | null;
  orderNumber?: string | null;
  customMessage?: string | null;
}): string {
  const lines: string[] = [
    "Namaste Fashion Cart Atelier! 🛍️",
    "",
    "*Customer Information:*",
  ];

  if (params.userName) {
    lines.push(`- *Name:* ${params.userName}`);
  } else {
    lines.push("- *Customer:* Storefront Visitor");
  }

  if (params.userPhone) {
    lines.push(`- *Mobile:* ${params.userPhone}`);
  }

  if (params.userEmail) {
    lines.push(`- *Email:* ${params.userEmail}`);
  }

  lines.push("");
  lines.push("*Inquiry Details & Context:*");

  if (params.productName) {
    const priceStr = params.productPrice ? ` (${formatINR(params.productPrice)})` : "";
    const skuStr = params.productSku ? ` [SKU: ${params.productSku}]` : "";
    lines.push(`- *Garment:* ${params.productName}${priceStr}${skuStr}`);
  }

  if (params.orderNumber) {
    lines.push(`- *Order Reference:* #${params.orderNumber}`);
  }

  if (params.pageTitle) {
    lines.push(`- *Viewing Page:* ${params.pageTitle}`);
  }

  if (params.pageUrl) {
    lines.push(`- *Storefront Link:* ${params.pageUrl}`);
  }

  lines.push("");
  lines.push("*Message / Query:*");
  lines.push(
    params.customMessage ||
      "Hi Fashion Cart team, I would like assistance with outfit styling, sizing details, or placing an order."
  );

  return lines.join("\n");
}

// -------------------------------------------------------------
// 2. Welcome / Signup WhatsApp
// -------------------------------------------------------------
export function getWelcomeWhatsAppMessage(name: string): string {
  return `Namaste ${name}! 👗 Welcome to Fashion Cart Luxury Atelier.
Your shopping account is now active. Enjoy our mastercrafted kurtis, tailored shirts, and luxury apparel.

🎁 Special Welcome Gift: Use code *FIRST10* at checkout for 10% OFF + Free Express Delivery.
Explore latest collection: ${APP_URL}/shop`;
}

// -------------------------------------------------------------
// 3. Order Placed WhatsApp
// -------------------------------------------------------------
export function getOrderPlacedWhatsAppMessage(order: {
  orderNumber: string;
  total: any;
  user?: { name: string };
  id: string;
}): string {
  const name = order.user?.name || "Shopper";
  return `Namaste ${name}! 🛍️
Thank you for shopping with Fashion Cart! Your order *#${order.orderNumber}* for *${formatINR(order.total)}* has been successfully received.

📦 View live order status & invoice:
${APP_URL}/account/orders/${order.id}`;
}

// -------------------------------------------------------------
// 4. Payment Verified & Processing WhatsApp
// -------------------------------------------------------------
export function getPaymentVerifiedWhatsAppMessage(order: {
  orderNumber: string;
  user?: { name: string };
  id: string;
}): string {
  const name = order.user?.name || "Customer";
  return `Namaste ${name}! 🎉
Your payment for Fashion Cart Order *#${order.orderNumber}* has been verified!
Our master atelier is now preparing and packing your pieces for dispatch.

📄 Download Official GST Tax Invoice PDF:
${APP_URL}/invoices/${order.id}`;
}

// -------------------------------------------------------------
// 5. Order Shipped with Live AWB Tracking WhatsApp
// -------------------------------------------------------------
export function getOrderShippedWhatsAppMessage(order: {
  orderNumber: string;
  carrierName?: string | null;
  trackingNumber?: string | null;
  user?: { name: string };
  id: string;
}): string {
  const name = order.user?.name || "Customer";
  const carrier = order.carrierName || "Express Courier";
  const awb = order.trackingNumber || "Assigned";
  return `Namaste ${name}! 🚚
Your Fashion Cart package *#${order.orderNumber}* has shipped!

📦 Carrier: *${carrier}*
🔖 Tracking AWB: *${awb}*

Track your live package delivery:
${APP_URL}/account/orders/${order.id}`;
}

// -------------------------------------------------------------
// 6. Order Delivered WhatsApp
// -------------------------------------------------------------
export function getOrderDeliveredWhatsAppMessage(order: {
  orderNumber: string;
  user?: { name: string };
  id: string;
}): string {
  const name = order.user?.name || "Customer";
  return `Namaste ${name}! 🎁
Your Fashion Cart Order *#${order.orderNumber}* has been delivered!
We hope you love your new outfit.

⭐ Please leave a quick review to help other shoppers:
${APP_URL}/account/orders/${order.id}`;
}

// -------------------------------------------------------------
// 7. Payment Proof Submission WhatsApp (Customer to Store Owner)
// -------------------------------------------------------------
export function getPaymentProofWhatsAppMessage(orderNumber: string, total: any, utr?: string | null): string {
  return `Namaste Fashion Cart Boutique! 💳
I have completed UPI payment for Order *#${orderNumber}* (Total: ${formatINR(total)}).

UTR / Transaction ID: *${utr || "Attached"}*
Please find my payment screenshot attached for verification.`;
}

// -------------------------------------------------------------
// 8. Password Recovery / Account Assistance WhatsApp
// -------------------------------------------------------------
export function getPasswordResetSupportWhatsAppMessage(emailOrPhone: string): string {
  return `Namaste Fashion Cart Support! 🔑
I need assistance recovering/resetting my account login password.
Registered Identifier: *${emailOrPhone}*`;
}
