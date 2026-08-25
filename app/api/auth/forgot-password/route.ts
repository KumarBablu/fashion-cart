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
    if (digits.length === 10) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: digits },
            { phone: `+91${digits}` },
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

  // If active user exists, dispatch password reset email
  if (user && user.isActive) {
    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "https://fashion-cart-5p7k.vercel.app";
    const { token, code: recoveryCode } = generatePasswordResetToken(user);
    const resetUrl = `${origin}/reset-password?token=${token}`;

    sendPasswordResetEmail(
      { name: user.name, email: user.email },
      resetUrl,
      recoveryCode
    ).catch((err) => {
      console.error("Password reset email dispatch failed:", err);
    });
  }

  // Uniform generic response to prevent account and name enumeration
  return NextResponse.json({
    success: true,
    message: "If an active account exists with the provided email or mobile number, password reset instructions have been dispatched.",
  });
}
