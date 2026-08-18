import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { z } from "zod";

const forgotSchema = z.object({
  identifier: z.string().trim().min(3, "Please enter your registered email address or mobile number"),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKeyFromRequest(req, "forgot-password"), 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many password recovery attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const raw = parsed.data.identifier.trim();
  let user = null;

  if (raw.includes("@")) {
    user = await prisma.user.findUnique({
      where: { email: raw.toLowerCase() },
    });
  } else {
    const digits = raw.replace(/\D/g, "").slice(-10);
    if (digits.length >= 7) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: digits },
            { phone: `+91${digits}` },
            { phone: { contains: digits } },
            { email: raw.toLowerCase() },
          ],
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email: raw.toLowerCase() },
      });
    }
  }

  // If user does not exist in database, return clear actionable error
  if (!user || !user.isActive) {
    return NextResponse.json(
      {
        error: `No registered account found matching "${raw}". Please check your email or mobile number, or sign up for a new account.`,
      },
      { status: 404 }
    );
  }

  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "https://fashion-cart-5p7k.vercel.app";
  const { token, code: recoveryCode } = generatePasswordResetToken(user);
  const resetUrl = `${origin}/reset-password?token=${token}`;

  // Dispatch Password Reset Email to actual customer inbox
  await sendPasswordResetEmail(
    { name: user.name, email: user.email },
    resetUrl,
    recoveryCode
  ).catch((err) => {
    console.error("Password reset email dispatch failed:", err);
  });

  // Mask email for privacy display: b***i@gmail.com
  const emailParts = user.email.split("@");
  const local = emailParts[0];
  const domain = emailParts[1];
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  const emailMasked = `${maskedLocal}@${domain}`;

  return NextResponse.json({
    success: true,
    message: `Verification code and recovery link dispatched to ${emailMasked}.`,
    emailMasked,
    name: user.name,
    token, // Provided so the user can enter the 6-digit code on the next screen directly
  });
}
