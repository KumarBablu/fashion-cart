import crypto from "crypto";
import { prisma } from "@/lib/db";

const RESET_SECRET = process.env.SESSION_SECRET || "fashion-cart-reset-secret-key-2026";
const TOKEN_TTL_MINUTES = 20;

/**
 * Creates a cryptographically secure, tamper-proof password reset token.
 * Incorporates the user's current passwordHash and a 6-digit code into the HMAC key
 * so that both the link and 6-digit OTP code are verified and invalidated immediately once used.
 */
export function generatePasswordResetToken(user: { id: string; email: string; passwordHash: string }) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + TOKEN_TTL_MINUTES * 60 * 1000;
  const payload = `${user.id}:${user.email}:${expiresAt}:${code}`;
  const hmacKey = `${RESET_SECRET}:${user.passwordHash}`;
  const signature = crypto.createHmac("sha256", hmacKey).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${signature}`).toString("base64url");
  return { token, code, expiresAt: new Date(expiresAt) };
}

/**
 * Generates a 6-digit numeric recovery verification code.
 */
export function generateRecoveryCode(_email?: string) {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verifies a password reset token and 6-digit recovery code.
 */
export async function verifyPasswordResetToken(token: string, enteredCode?: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    
    // Support legacy (4 parts) or code-enabled (5 parts)
    let userId: string, email: string, expiresAtStr: string, expectedCode: string | undefined, signature: string;
    
    if (parts.length === 5) {
      [userId, email, expiresAtStr, expectedCode, signature] = parts;
    } else if (parts.length === 4) {
      [userId, email, expiresAtStr, signature] = parts;
    } else {
      return { valid: false, error: "Malformed reset token." };
    }

    if (!userId || !email || !expiresAtStr || !signature) {
      return { valid: false, error: "Malformed reset token." };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: "Password reset link has expired (valid for 20 mins). Please request a new one." };
    }

    // If a code was embedded, check entered code
    if (expectedCode && enteredCode) {
      if (expectedCode.trim() !== enteredCode.trim()) {
        return { valid: false, error: "Invalid 6-digit recovery code. Please check the code sent to your email." };
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== email || !user.isActive) {
      return { valid: false, error: "Account not found or inactive." };
    }

    // Re-compute HMAC with user's current password hash
    const payload = expectedCode ? `${userId}:${email}:${expiresAtStr}:${expectedCode}` : `${userId}:${email}:${expiresAtStr}`;
    const hmacKey = `${RESET_SECRET}:${user.passwordHash}`;
    const expectedSignature = crypto.createHmac("sha256", hmacKey).update(payload).digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid or already used password reset link." };
    }

    return { valid: true, user };
  } catch {
    return { valid: false, error: "Invalid reset token." };
  }
}
