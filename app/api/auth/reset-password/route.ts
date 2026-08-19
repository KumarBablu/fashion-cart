import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPasswordResetToken } from "@/lib/auth/password-reset";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordChangedEmail } from "@/lib/email/service";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  code: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKeyFromRequest(req, "reset-password"), 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many password reset attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { token, code, newPassword } = parsed.data;
  const verification = await verifyPasswordResetToken(token, code);

  if (!verification.valid || !verification.user) {
    return NextResponse.json({ error: verification.error || "Invalid or expired token." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    // Update user's password
    await tx.user.update({
      where: { id: verification.user.id },
      data: { passwordHash },
    });

    // Invalidate all existing sessions for security
    await tx.session.deleteMany({
      where: { userId: verification.user.id },
    });
  });

  // Dispatch Password Changed Security Notification Email asynchronously
  sendPasswordChangedEmail({
    name: verification.user.name,
    email: verification.user.email,
  }).catch((err) => {
    console.error("Password changed email dispatch failed:", err);
  });

  return NextResponse.json({
    success: true,
    message: "Your password has been reset successfully. You can now login with your new password.",
  });
}
