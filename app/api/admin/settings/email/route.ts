import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/service";
import { z } from "zod";

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.number().int().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  smtpSecure: z.boolean().default(false),
  fromEmail: z.string().email().default("notifications@fashioncart.shop"),
  fromName: z.string().default("Fashion Cart"),
  notifyAdminEmail: z.string().email().optional().nullable(),
  sendTestTo: z.string().email().optional(),
});

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.emailSettings.findFirst();
  const maskedSettings = settings
    ? {
        ...settings,
        smtpPassword: settings.smtpPassword ? "••••••••" : null,
      }
    : null;

  return NextResponse.json({ settings: maskedSettings });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = emailSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid settings" }, { status: 400 });
  }

  const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, fromEmail, fromName, notifyAdminEmail, sendTestTo } = parsed.data;

  const existing = await prisma.emailSettings.findFirst();
  const resolvedPassword =
    smtpPassword && smtpPassword !== "••••••••"
      ? smtpPassword
      : existing?.smtpPassword || null;

  const settings = existing
    ? await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          smtpHost: smtpHost || null,
          smtpPort: smtpPort || 587,
          smtpUser: smtpUser || null,
          smtpPassword: resolvedPassword,
          smtpSecure,
          fromEmail,
          fromName,
          notifyAdminEmail: notifyAdminEmail || null,
        },
      })
    : await prisma.emailSettings.create({
        data: {
          smtpHost: smtpHost || null,
          smtpPort: smtpPort || 587,
          smtpUser: smtpUser || null,
          smtpPassword: resolvedPassword,
          smtpSecure,
          fromEmail,
          fromName,
          notifyAdminEmail: notifyAdminEmail || null,
        },
      });

  // If the admin requested a test email, send it now
  let testResult: { success: boolean; simulated: boolean; error?: string } | undefined;
  if (sendTestTo) {
    testResult = await sendEmail({
      to: sendTestTo,
      subject: "Test Notification: Fashion Cart Email Service is Connected! ✉️",
      html: `
        <div style="font-family: sans-serif; background-color: #14171d; color: #f3f4f6; padding: 28px; border-radius: 12px;">
          <h2 style="color: #fbbf24; margin-top: 0;">Email Service Verification Successful! 🎉</h2>
          <p>This is a test notification confirming that your Fashion Cart email gateway is properly configured and actively delivering transactional messages to customers.</p>
          <div style="background-color: #1b2029; padding: 16px; border-radius: 8px; border: 1px solid #282f3d; margin: 16px 0; font-size: 13px;">
            <p style="margin: 0;"><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;<br /><strong>Configured Host:</strong> ${smtpHost || "Local Simulation Mode"}</p>
          </div>
        </div>
      `,
      templateName: "TEST_EMAIL",
    });
  }

  return NextResponse.json({ settings, testResult });
}
