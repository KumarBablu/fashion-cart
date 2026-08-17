import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/service";
import { z } from "zod";

const reachSchema = z.object({
  subject: z.string().trim().min(3, "Subject is required"),
  message: z.string().trim().min(5, "Message body is required"),
  channel: z.enum(["EMAIL", "NOTE"]).default("EMAIL"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = reachSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const customer = await prisma.user.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const { subject, message, channel } = parsed.data;

  if (channel === "EMAIL") {
    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E8E3D8; border-radius: 16px; overflow: hidden; color: #0C3B2E;">
        <div style="background-color: #0C3B2E; padding: 24px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">Fashion Cart</h1>
          <p style="color: #FFBA00; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Customer Support &amp; Boutique Concierge</p>
        </div>
        <div style="padding: 28px 24px; line-height: 1.6; font-size: 14px; color: #2C483F;">
          <p style="margin-top: 0;">Hello <strong>${customer.name}</strong>,</p>
          <div style="background-color: #FAF8F5; border: 1px solid #E8E3D8; border-radius: 12px; padding: 18px; margin: 20px 0; white-space: pre-wrap; font-size: 14px; color: #0C3B2E; line-height: 1.6;">${message}</div>
          <p style="margin-bottom: 0;">Warm regards,<br /><strong>Fashion Cart Support Team</strong></p>
        </div>
        <div style="padding: 16px 24px; background: #FAF8F5; border-top: 1px solid #E8E3D8; text-align: center; font-size: 11px; color: #5B7A6F;">
          Sent to ${customer.email} · Fashion Cart Luxury Atelier &amp; Fine Apparel
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: customer.email,
      subject: `${subject} — Fashion Cart`,
      html: formattedHtml,
      templateName: "ADMIN_DIRECT_MESSAGE",
      metadata: { customerId: customer.id, sentByAdmin: admin.email },
    });

    return NextResponse.json({
      success: true,
      simulated: result.simulated,
      message: `Message dispatched to ${customer.email}.`,
    });
  }

  return NextResponse.json({ success: true, message: "Customer communication recorded." });
}
