import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePasswordResetToken, generateRecoveryCode } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/service";
import { z } from "zod";

const forgotSchema = z.object({
  identifier: z.string().trim().min(3, "Please enter your registered email address or phone number"),
});

export async function POST(req: NextRequest) {
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

  const { token, expiresAt } = generatePasswordResetToken(user);
  const recoveryCode = generateRecoveryCode(user.email);
  const resetUrl = `/reset-password?token=${token}`;

  // Dispatch Password Reset Email to customer
  await sendPasswordResetEmail(
    { name: user.name, email: user.email },
    resetUrl,
    recoveryCode
  ).catch((err) => {
    console.error("Password reset email dispatch failed:", err);
  });

  return NextResponse.json({
    success: true,
    message: "Recovery email and link generated successfully.",
    resetUrl,
    token,
    recoveryCode,
    emailMasked: user.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${"*".repeat(Math.max(2, b.length))}${c}`),
    expiresAt,
  });
}
