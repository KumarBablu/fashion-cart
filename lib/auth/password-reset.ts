import crypto from "crypto";
import { prisma } from "@/lib/db";

const RESET_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || "fc-auth-security-salt-v1";
const TOKEN_TTL_MINUTES = 20;

/**
 * Creates a cryptographically secure, tamper-proof password reset token.
 * Uses crypto.randomInt for high-entropy 6-digit OTP code and binds to current passwordHash.
 */
export function generatePasswordResetToken(user: { id: string; email: string; passwordHash: string }) {
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + TOKEN_TTL_MINUTES * 60 * 1000;
  const payload = `${user.id}:${user.email}:${expiresAt}:${code}`;
  const hmacKey = `${RESET_SECRET}:${user.passwordHash}`;
  const signature = crypto.createHmac("sha256", hmacKey).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${signature}`).toString("base64url");
  return { token, code, expiresAt: new Date(expiresAt) };
}

/**
 * Generates a cryptographically secure 6-digit numeric recovery verification code.
 */
export function generateRecoveryCode(_email?: string): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Verifies a password reset token and optional 6-digit recovery code using constant-time comparison.
 */
export async function verifyPasswordResetToken(token: string, enteredCode?: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    
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

    // If code verification is requested, compare constant-time
    if (expectedCode && enteredCode) {
      const expBuf = Buffer.from(expectedCode.trim());
      const entBuf = Buffer.from(enteredCode.trim());
      if (expBuf.length !== entBuf.length || !crypto.timingSafeEqual(expBuf, entBuf)) {
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

    const sigBuf = Buffer.from(signature, "utf-8");
    const expSigBuf = Buffer.from(expectedSignature, "utf-8");

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return { valid: false, error: "Invalid or already used password reset link." };
    }

    return { valid: true, user };
  } catch {
    return { valid: false, error: "Invalid reset token." };
  }
}
