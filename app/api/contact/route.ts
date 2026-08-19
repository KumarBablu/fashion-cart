import { NextRequest, NextResponse } from "next/server";
import { sendContactInquiryEmail, sendEmail } from "@/lib/email/service";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please provide your name"),
  email: z.string().trim().email("Please provide a valid email address"),
  subject: z.string().trim().min(3, "Please provide a subject"),
  orderNumber: z.string().trim().optional(),
  message: z.string().trim().min(10, "Please enter your message (at least 10 characters)"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { name, email, subject, orderNumber, message } = parsed.data;
  const fullSubject = orderNumber ? `[Order #${orderNumber}] ${subject}` : subject;

  // 1. Notify Admin/Store Owner asynchronously
  sendContactInquiryEmail(name, email, fullSubject, message).catch((err) => {
    console.error("Admin contact inquiry email failed:", err);
  });

  // 2. Send Auto-Acknowledgement Email to Customer
  const ackHtml = `
    <div style="font-family: sans-serif; color: #f3f4f6; background-color: #14171d; padding: 24px; border-radius: 12px;">
      <h2 style="color: #fbbf24; margin-top: 0;">We have received your message! ✉️</h2>
      <p>Hello ${name},</p>
      <p>Thank you for reaching out to Fashion Cart. Our customer care team has received your inquiry regarding <strong>"${fullSubject}"</strong> and will get back to you within 24 hours.</p>
      <div style="background-color: #1b2029; padding: 16px; border-radius: 8px; border: 1px solid #282f3d; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #d1d5db;"><strong>Your Message:</strong><br />${message}</p>
      </div>
      <p style="font-size: 12px; color: #9ca3af;">Warm regards,<br />Fashion Cart Support Team</p>
    </div>
  `;

  sendEmail({
    to: email,
    subject: `Message Received: ${fullSubject} (Fashion Cart)`,
    html: ackHtml,
    templateName: "CONTACT_ACK",
  }).catch(() => null);

  return NextResponse.json({
    success: true,
    message: "Thank you! Your message has been sent successfully. Check your email for confirmation.",
  });
}
