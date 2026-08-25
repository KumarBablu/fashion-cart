import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  orderPlacedEmailTemplate,
  paymentVerifiedEmailTemplate,
  orderShippedEmailTemplate,
  orderDeliveredEmailTemplate,
  orderCancelledEmailTemplate,
  contactInquiryEmailTemplate,
  loginAlertEmailTemplate,
  failedLoginAlertEmailTemplate,
  profileUpdatedEmailTemplate,
  adminAccessAttemptAlertEmailTemplate,
  accountDeletedEmailTemplate,
  orderReachoutEmailTemplate,
} from "./templates";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateName: string;
  attachments?: { filename: string; content?: Buffer | string; path?: string; contentType?: string }[];
  metadata?: Record<string, unknown>;
};

/**
 * Gets or creates the nodemailer transport based on database settings or environment variables.
 */
async function getEmailTransport() {
  const settings = await prisma.emailSettings.findFirst().catch(() => null);

  const host = settings?.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = settings?.smtpPort || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465);
  const user = settings?.smtpUser || process.env.SMTP_USER || "Fashioncart.support@gmail.com";
  const rawPass = settings?.smtpPassword || process.env.SMTP_PASS;
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : undefined;
  const secure = settings?.smtpSecure ?? (port === 465);
  const fromEmail = settings?.fromEmail || user || "Fashioncart.support@gmail.com";
  const fromName = settings?.fromName || process.env.FROM_NAME || "Fashion Cart Premium Outlet";

  const isConfigured = !!(host && user && pass);

  if (isConfigured) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
    });
    return { transporter, from: `"${fromName}" <${fromEmail}>`, isConfigured: true };
  }

  // Simulated transporter for local/dev environments or when SMTP is not configured yet
  return {
    transporter: null,
    from: `"${fromName}" <${fromEmail}>`,
    isConfigured: false,
  };
}

/**
 * Primary dispatch function: sends email via SMTP or logs to simulation storage & EmailLog database table.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  try {
    const { transporter, from, isConfigured } = await getEmailTransport();

    if (isConfigured && transporter) {
      const sendPromise = transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: opts.attachments,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Email dispatch timed out after 4s")), 4000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      // Log successful send asynchronously
      prisma.emailLog.create({
        data: {
          recipient: opts.to,
          subject: opts.subject,
          template: opts.templateName,
          status: "SENT",
          metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
        },
      }).catch(() => null);

      console.log(`[EMAIL SENT] To: ${opts.to} | Subject: ${opts.subject} [Template: ${opts.templateName}]`);
      return { success: true, simulated: false };
    }

    // Simulated email delivery
    console.log(`\n======================================================`);
    console.log(`[SIMULATED EMAIL DISPATCHED]`);
    console.log(`To: ${opts.to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Template: ${opts.templateName}`);
    console.log(`======================================================\n`);

    await prisma.emailLog.create({
      data: {
        recipient: opts.to,
        subject: opts.subject,
        template: opts.templateName,
        status: "SIMULATED",
        metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
      },
    }).catch(() => null);

    return { success: true, simulated: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send email";
    console.error(`[EMAIL ERROR] Failed sending to ${opts.to}:`, errorMsg);

    await prisma.emailLog.create({
      data: {
        recipient: opts.to,
        subject: opts.subject,
        template: opts.templateName,
        status: "FAILED",
        error: errorMsg,
        metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
      },
    }).catch(() => null);

    return { success: false, simulated: false, error: errorMsg };
  }
}

// -------------------------------------------------------------
// Transactional Helper Handlers
// -------------------------------------------------------------

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const html = welcomeEmailTemplate(user.name);
  return sendEmail({
    to: user.email,
    subject: "Welcome to Fashion Cart! 🎉 Your 10% Welcome Gift Inside",
    html,
    templateName: "WELCOME",
    metadata: { userId: user.name },
  });
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, resetUrl: string, recoveryCode: string) {
  const html = passwordResetEmailTemplate(user.name, resetUrl, recoveryCode);
  return sendEmail({
    to: user.email,
    subject: "Reset Your Fashion Cart Password (Recovery Link)",
    html,
    templateName: "PASSWORD_RESET",
    metadata: { recoveryCode },
  });
}

export async function sendPasswordChangedEmail(user: { name: string; email: string }) {
  const html = passwordChangedEmailTemplate(user.name);
  return sendEmail({
    to: user.email,
    subject: "Security Notification: Password Changed Successfully",
    html,
    templateName: "PASSWORD_CHANGED",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderPlacedEmail(order: any) {
  const html = orderPlacedEmailTemplate(order);

  // 1. Send confirmation to Customer
  const customerResult = await sendEmail({
    to: order.user.email,
    subject: `Order Confirmed: #${order.orderNumber} (Fashion Cart)`,
    html,
    templateName: "ORDER_PLACED",
    metadata: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
  });

  // 2. Also send alert to Admin
  const settings = await prisma.emailSettings.findFirst().catch(() => null);
  const adminEmail = settings?.notifyAdminEmail || process.env.ADMIN_NOTIFY_EMAIL || "bablusoni2825@gmail.com";

  if (adminEmail && adminEmail !== order.user.email) {
    await sendEmail({
      to: adminEmail,
      subject: `🚨 [New Order Placed] #${order.orderNumber} - ₹${Number(order.total).toLocaleString("en-IN")}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0C3B2E;">🛍️ New Customer Order Received!</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Customer Name:</strong> ${order.user.name} (${order.user.email})</p>
          <p><strong>Total Value:</strong> ₹${Number(order.total).toLocaleString("en-IN")}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p style="margin-top: 20px;">
            <a href="https://fashion-cart-5p7k.vercel.app/admin/orders/${order.id}" style="background-color: #0C3B2E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Order in Admin Dashboard →
            </a>
          </p>
        </div>
      `,
      templateName: "ADMIN_NEW_ORDER_ALERT",
      metadata: { orderId: order.id },
    }).catch(() => null);
  }

  return customerResult;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendPaymentProofSubmittedAdminAlert(order: any, utrNumber?: string | null) {
  const settings = await prisma.emailSettings.findFirst().catch(() => null);
  const adminEmail = settings?.notifyAdminEmail || process.env.ADMIN_NOTIFY_EMAIL || "bablusoni2825@gmail.com";

  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `💳 [Payment Proof Submitted] Order #${order.orderNumber} (UTR: ${utrNumber || "N/A"})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0C3B2E;">💳 Payment Proof Uploaded for Verification!</h2>
          <p>A customer has uploaded their payment proof for verification.</p>
          <p><strong>Order:</strong> #${order.orderNumber}</p>
          <p><strong>Customer:</strong> ${order.user?.name || "Customer"}</p>
          <p><strong>UTR / Transaction ID:</strong> <span style="font-family: monospace; font-weight: bold;">${utrNumber || "N/A"}</span></p>
          <p style="margin-top: 20px;">
            <a href="https://fashion-cart-5p7k.vercel.app/admin/payments" style="background-color: #FFBA00; color: #0C3B2E; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Open Payment Verification Desk →
            </a>
          </p>
        </div>
      `,
      templateName: "ADMIN_PAYMENT_PROOF_ALERT",
      metadata: { orderId: order.id, utr: utrNumber },
    }).catch(() => null);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendPaymentVerifiedEmail(order: any, invoiceBuffer?: Buffer, invoiceFilename?: string) {
  const html = paymentVerifiedEmailTemplate(order);
  const attachments = invoiceBuffer
    ? [{ filename: invoiceFilename || `Invoice-${order.orderNumber}.pdf`, content: invoiceBuffer, contentType: "application/pdf" }]
    : undefined;

  return sendEmail({
    to: order.user.email,
    subject: `Payment Verified: Order #${order.orderNumber} is Processing`,
    html,
    templateName: "PAYMENT_VERIFIED",
    attachments,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderShippedEmail(order: any) {
  const html = orderShippedEmailTemplate(order, order.carrierName, order.trackingNumber);
  return sendEmail({
    to: order.user.email,
    subject: `Shipped! Order #${order.orderNumber} is on the way 🚚`,
    html,
    templateName: "ORDER_SHIPPED",
    metadata: { orderId: order.id, trackingNumber: order.trackingNumber, carrierName: order.carrierName },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderDeliveredEmail(order: any) {
  const html = orderDeliveredEmailTemplate(order);
  return sendEmail({
    to: order.user.email,
    subject: `Delivered: Order #${order.orderNumber} 🎁`,
    html,
    templateName: "ORDER_DELIVERED",
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendOrderCancelledEmail(order: any, reason?: string | null) {
  const html = orderCancelledEmailTemplate(order, reason);
  return sendEmail({
    to: order.user.email,
    subject: `Order #${order.orderNumber} has been Cancelled`,
    html,
    templateName: "ORDER_CANCELLED",
    metadata: { orderId: order.id, reason },
  });
}

export async function sendContactInquiryEmail(name: string, email: string, subject: string, message: string) {
  const settings = await prisma.emailSettings.findFirst().catch(() => null);
  const notifyEmail = settings?.notifyAdminEmail || process.env.ADMIN_NOTIFY_EMAIL || "admin@fashioncart.shop";

  const html = contactInquiryEmailTemplate(name, email, subject, message);
  return sendEmail({
    to: notifyEmail,
    subject: `[Contact Form] ${subject} - ${name}`,
    html,
    templateName: "CONTACT_INQUIRY",
    metadata: { customerName: name, customerEmail: email },
  });
}

export async function sendLoginAlertEmail({
  name,
  email,
  identifier,
  userAgent,
}: {
  name: string;
  email: string;
  identifier: string;
  userAgent?: string | null;
}) {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = loginAlertEmailTemplate(name, identifier, timestamp, userAgent);
  return sendEmail({
    to: email,
    subject: "🔐 Security Notice: Successful Login (Fashion Cart)",
    html,
    templateName: "LOGIN_ALERT",
    metadata: { identifier, timestamp, userAgent },
  });
}

export async function sendFailedLoginAlertEmail({
  name,
  email,
  identifier,
  userAgent,
}: {
  name: string;
  email: string;
  identifier: string;
  userAgent?: string | null;
}) {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = failedLoginAlertEmailTemplate(name, identifier, timestamp, userAgent);
  return sendEmail({
    to: email,
    subject: "⚠️ Security Warning: Unsuccessful Login Attempt (Fashion Cart)",
    html,
    templateName: "FAILED_LOGIN_ALERT",
    metadata: { identifier, timestamp, userAgent },
  });
}

export async function sendProfileUpdatedEmail({
  name,
  email,
  changesSummary,
}: {
  name: string;
  email: string;
  changesSummary: string;
}) {
  const html = profileUpdatedEmailTemplate(name, email, changesSummary);
  return sendEmail({
    to: email,
    subject: "👤 Notice: Your Fashion Cart Profile Was Updated",
    html,
    templateName: "PROFILE_UPDATED",
    metadata: { changesSummary },
  });
}

export async function sendAdminAccessAttemptAlertEmail({
  attemptEmail,
  userAgent,
}: {
  attemptEmail: string;
  userAgent?: string | null;
}) {
  const settings = await prisma.emailSettings.findFirst().catch(() => null);
  const configuredEmail = settings?.notifyAdminEmail || process.env.ADMIN_NOTIFY_EMAIL;
  const adminEmails = Array.from(
    new Set(
      ["bablusoni2825@gmail.com", "Kumar.bablu9547.sv@gmail.com", configuredEmail]
        .filter(Boolean)
        .map((e) => (e as string).toLowerCase().trim())
    )
  );

  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = adminAccessAttemptAlertEmailTemplate(attemptEmail, timestamp, userAgent);

  for (const recipient of adminEmails) {
    await sendEmail({
      to: recipient,
      subject: `🚨 [Security Alert] Unauthorized Admin Console Access Attempt (${attemptEmail})`,
      html,
      templateName: "ADMIN_ACCESS_ATTEMPT_ALERT",
      metadata: { attemptEmail, timestamp, userAgent },
    }).catch((err) => console.error(`Admin alert dispatch to ${recipient} failed:`, err));
  }
  return { success: true, simulated: false };
}

export async function sendAccountDeletedEmail(user: { name: string; email: string }) {
  const html = accountDeletedEmailTemplate(user.name, user.email);
  return sendEmail({
    to: user.email,
    subject: "Notice: Your Fashion Cart Account Has Been Closed",
    html,
    templateName: "ACCOUNT_DELETED",
    metadata: { userEmail: user.email },
  });
}

export async function sendOrderReachoutEmail(params: {
  recipientEmail: string;
  customerName: string;
  orderNumber: string;
  subject: string;
  message: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  items?: Array<{ name: string; quantity: number; size?: string; price?: number }>;
  actionUrl?: string;
  actionText?: string;
  storeName?: string;
  sentByAdminEmail?: string;
}) {
  const html = orderReachoutEmailTemplate(params);
  return sendEmail({
    to: params.recipientEmail,
    subject: params.subject,
    html,
    templateName: "ADMIN_ORDER_REACHOUT",
    metadata: {
      orderNumber: params.orderNumber,
      sentByAdmin: params.sentByAdminEmail,
      subject: params.subject,
      customerEmail: params.recipientEmail,
    },
  });
}

