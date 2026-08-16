import { formatINR } from "@/lib/format";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function layout(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; color: #0C3B2E; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(12, 59, 46, 0.08); }
    .header { background-color: #0C3B2E; padding: 28px 24px; text-align: center; }
    .brand { font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; }
    .body { padding: 32px 24px; line-height: 1.6; font-size: 14px; color: #2C483F; }
    .button { display: inline-block; padding: 12px 28px; background-color: #FFBA00; color: #0C3B2E !important; text-decoration: none; border-radius: 9999px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0; text-align: center; box-shadow: 0 4px 12px rgba(255, 186, 0, 0.3); }
    .card { background-color: #FAF8F5; border: 1px solid #E8E3D8; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .table th { text-align: left; padding: 10px 8px; border-bottom: 1px solid #E8E3D8; color: #5B7A6F; font-size: 11px; text-transform: uppercase; }
    .table td { padding: 12px 8px; border-bottom: 1px solid #F2EFE8; color: #0C3B2E; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #FFF7E0; color: #0C3B2E; border: 1px solid #FFBA00; }
    .code-box { font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 6px; color: #0C3B2E; background: #F2EFE8; padding: 16px; border-radius: 12px; text-align: center; border: 1px dashed #BB8A52; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #5B7A6F; border-top: 1px solid #E8E3D8; background-color: #FAF8F5; }
    .footer a { color: #0C3B2E; text-decoration: underline; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${BASE_URL}/fashion-cart-logo-transparent.svg" alt="Fashion Cart" width="44" height="44" style="margin: 0 auto 6px auto; display: block; border-radius: 8px;" />
      <div class="brand">Fashion Cart</div>
      <div style="font-size: 11px; color: #FFBA00; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">Haute Couture &amp; Everyday Luxury</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">&copy; ${new Date().getFullYear()} Fashion Cart Boutique. All rights reserved.</p>
      <p style="margin: 0;">Need assistance? Contact us at <a href="mailto:support@fashioncart.shop">support@fashioncart.shop</a></p>
    </div>
  </div>
</body>
</html>`;
}

// 1. Welcome Email
export function welcomeEmailTemplate(name: string) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Welcome to Fashion Cart, ${name}! 👋</h2>
    <p>We are thrilled to welcome you to our community. Your account is active and ready for exploring our curated fashion collections, ethnic kurtis, and tailored shirts.</p>
    
    <div class="card">
      <h3 style="color: #0F172A; margin-top: 0; font-size: 14px;">🎁 Exclusive Welcome Offer</h3>
      <p style="margin: 4px 0 12px 0;">Use coupon code <strong style="color: #0F172A; font-family: monospace; background: #E2E8F0; padding: 2px 6px; border-radius: 4px;">FIRST10</strong> at checkout to get an instant <strong>10% OFF</strong> + Free Express Delivery.</p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/shop" class="button">Start Shopping →</a>
    </div>

    <p style="font-size: 12px; color: #64748B;">You can manage your saved addresses, track real-time orders, and view invoices anytime from your <a href="${BASE_URL}/account" style="color: #0F172A;">Account Dashboard</a>.</p>
  `;
  return layout("Welcome to Fashion Cart", content);
}

// 2. Password Reset / Account Recovery Email
export function passwordResetEmailTemplate(name: string, resetUrl: string, recoveryCode: string) {
  const fullUrl = resetUrl.startsWith("http") ? resetUrl : `${BASE_URL}${resetUrl}`;
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Reset Your Password</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset the password for your Fashion Cart account. Use your 6-digit recovery code or click the button below to update your password:</p>

    <div class="code-box">
      ${recoveryCode}
    </div>

    <div style="text-align: center;">
      <a href="${fullUrl}" class="button">Reset Password →</a>
    </div>

    <p style="font-size: 12px; color: #64748B;">This link and recovery code will expire in <strong>20 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
  `;
  return layout("Reset Your Fashion Cart Password", content);
}

// 3. Password Changed Confirmation
export function passwordChangedEmailTemplate(name: string) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Security Alert: Password Updated</h2>
    <p>Hello ${name},</p>
    <p>The password for your Fashion Cart account was recently updated. All previous sessions have been invalidated for your protection.</p>
    
    <div class="card">
      <p style="margin: 0; font-size: 13px;">If you performed this change, no further action is required. If you did not authorize this change, please contact us immediately at <a href="mailto:support@fashioncart.shop" style="color: #0F172A;">support@fashioncart.shop</a>.</p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/login" class="button">Sign In Now →</a>
    </div>
  `;
  return layout("Password Changed Successfully", content);
}

type OrderItemSummary = {
  productNameSnapshot: string;
  colourSnapshot: string;
  sizeSnapshot: string;
  quantity: number;
  unitPrice: number | string;
  total: number | string;
};

type OrderDataSummary = {
  id: string;
  orderNumber: string;
  subtotal: number | string;
  discount: number | string;
  deliveryCharge: number | string;
  total: number | string;
  paymentMethod: string;
  status: string;
  items: OrderItemSummary[];
  user: { name: string; email: string };
  shippingAddressSnapshot: {
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pinCode: string;
  };
};

// 4. Order Placed / Receipt Email
export function orderPlacedEmailTemplate(order: OrderDataSummary) {
  const addr = order.shippingAddressSnapshot;
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td>
          <strong>${item.productNameSnapshot}</strong><br />
          <span style="font-size: 11px; color: #64748B;">${item.colourSnapshot} · Size ${item.sizeSnapshot}</span>
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatINR(item.total)}</td>
      </tr>
    `
    )
    .join("");

  const content = `
    <h2 style="color: #0F172A; margin: 0;">Order Confirmed! 🛍️</h2>
    <p style="margin-top: 6px;">Thank you for your order, ${order.user.name}! We have received order <strong>#${order.orderNumber}</strong>.</p>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top: 1px solid #E2E8F0; padding-top: 12px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748B;">Subtotal</span>
          <span>${formatINR(order.subtotal)}</span>
        </div>
        ${
          Number(order.discount) > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16A34A;">
                <span>Coupon Discount</span>
                <span>- ${formatINR(order.discount)}</span>
              </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748B;">Express Delivery</span>
          <span>${Number(order.deliveryCharge) === 0 ? "FREE" : formatINR(order.deliveryCharge)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0F172A; padding-top: 8px; border-top: 1px solid #E2E8F0; margin-top: 8px;">
          <span>Total Amount</span>
          <span>${formatINR(order.total)}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h4 style="margin: 0 0 6px 0; color: #0F172A; font-size: 12px; text-transform: uppercase;">Shipping Address:</h4>
      <p style="margin: 0; font-size: 13px; line-height: 1.5;">
        <strong>${addr.fullName}</strong> (${addr.mobileNumber})<br />
        ${addr.addressLine1}${addr.addressLine2 ? `, ${addr.addressLine2}` : ""}<br />
        ${addr.city}, ${addr.state} - ${addr.pinCode}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/account/orders/${order.id}" class="button">Track Order Status →</a>
    </div>
  `;
  return layout(`Order Confirmed #${order.orderNumber}`, content);
}

// 5. Payment Verified & Order Confirmed Email
export function paymentVerifiedEmailTemplate(order: OrderDataSummary, invoiceNumber?: string) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Payment Verified! 🎉</h2>
    <p>Hello ${order.user.name},</p>
    <p>We have verified your payment for order <strong>#${order.orderNumber}</strong> (${formatINR(order.total)}). Your order is confirmed and being prepared for shipment.</p>

    <div class="card">
      <p style="margin: 0; font-size: 13px;">
        <strong>Invoice:</strong> ${invoiceNumber || `INV-${order.orderNumber}`}<br />
        <strong>Payment Method:</strong> ${order.paymentMethod.replace(/_/g, " ")}<br />
        <strong>Status:</strong> <span class="badge">CONFIRMED &amp; PROCESSING</span>
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/api/invoices/${order.id}" class="button">Download Official Tax Invoice PDF 📥</a>
    </div>
  `;
  return layout(`Payment Verified for Order #${order.orderNumber}`, content);
}

// 6. Order Shipped Email
export function orderShippedEmailTemplate(order: OrderDataSummary, carrierName?: string | null, trackingNumber?: string | null) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Your Package has Shipped! 🚚</h2>
    <p>Hello ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been handed over to our courier partner.</p>

    <div class="card">
      <h3 style="color: #0F172A; margin-top: 0; font-size: 14px;">Tracking Information</h3>
      <p style="margin: 4px 0;"><strong>Carrier:</strong> ${carrierName || "Express Courier"}</p>
      <p style="margin: 4px 0;"><strong>AWB / Tracking Number:</strong> <span style="font-family: monospace; font-weight: bold;">${trackingNumber || "Pending Scan"}</span></p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/account/orders/${order.id}" class="button">Track Package →</a>
    </div>
  `;
  return layout(`Your Order #${order.orderNumber} Has Shipped`, content);
}

// 7. Order Delivered Email
export function orderDeliveredEmailTemplate(order: OrderDataSummary) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Package Delivered! 🎁</h2>
    <p>Hello ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been delivered. We hope you love your new pieces!</p>

    <div class="card">
      <h3 style="color: #0F172A; margin-top: 0; font-size: 14px;">How was your experience?</h3>
      <p style="margin: 4px 0;">Leave a quick review on the product page to help other shoppers.</p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/account/orders/${order.id}" class="button">Write a Review →</a>
    </div>
  `;
  return layout(`Delivered: Order #${order.orderNumber}`, content);
}

// 8. Order Cancelled Email
export function orderCancelledEmailTemplate(order: OrderDataSummary, reason?: string | null) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">Order Cancelled</h2>
    <p>Hello ${order.user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled${reason ? ` (${reason})` : ""}. Any inventory reserved has been released.</p>

    <div class="card">
      <p style="margin: 0; font-size: 13px;">If you have any questions regarding payment refunds, please contact us at <a href="mailto:support@fashioncart.shop" style="color: #0F172A;">support@fashioncart.shop</a>.</p>
    </div>

    <div style="text-align: center;">
      <a href="${BASE_URL}/shop" class="button">Explore Other Outfits →</a>
    </div>
  `;
  return layout(`Order #${order.orderNumber} Cancelled`, content);
}

// 9. Contact Us Inquiry Email
export function contactInquiryEmailTemplate(name: string, email: string, subject: string, message: string) {
  const content = `
    <h2 style="color: #0F172A; margin-top: 0;">New Customer Inquiry Received 📩</h2>
    <div class="card">
      <p style="margin: 4px 0;"><strong>From:</strong> ${name} (&lt;${email}&gt;)</p>
      <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>
      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 12px 0;" />
      <p style="margin: 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
    </div>
  `;
  return layout(`Inquiry: ${subject}`, content);
}
