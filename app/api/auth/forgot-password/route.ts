import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePasswordResetToken, generateRecoveryCode } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { z } from "zod";

const forgotSchema = z.object({
  identifier: z.string().trim().min(3, "Please enter your registered email address or phone number"),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKeyFromRequest(req, "forgot-password"), 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many password recovery attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const raw = parsed.data.identifier.toLowerCase();

  // Find user by email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: raw, mode: "insensitive" } },
        { phone: { equals: parsed.data.identifier } },
      ],
      isActive: true,
    },
  });

  if (!user) {
    return NextResponse.json({
      success: true,
      message: "If an active account exists with these details, recovery instructions have been prepared.",
    });
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

  return NextResponse.json({
    success: true,
    message: "If an active account is registered with these details, a secure password recovery link has been dispatched to the account holder's email inbox.",
  });
}
