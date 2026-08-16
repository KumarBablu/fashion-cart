import crypto from "crypto";
import { prisma } from "@/lib/db";

const RESET_SECRET = process.env.SESSION_SECRET || "fashion-cart-reset-secret-key-2026";
const TOKEN_TTL_MINUTES = 20;

/**
 * Creates a cryptographically secure, tamper-proof password reset token.
 * Incorporates the user's current passwordHash into the HMAC key so that
 * once the password is changed, the reset token is instantly and irreversibly invalidated.
 */
export function generatePasswordResetToken(user: { id: string; email: string; passwordHash: string }) {
  const expiresAt = Date.now() + TOKEN_TTL_MINUTES * 60 * 1000;
  const payload = `${user.id}:${user.email}:${expiresAt}`;
  const hmacKey = `${RESET_SECRET}:${user.passwordHash}`;
  const signature = crypto.createHmac("sha256", hmacKey).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${signature}`).toString("base64url");
  return { token, expiresAt: new Date(expiresAt) };
}

/**
 * Generates a 6-digit numeric recovery verification code.
 */
export function generateRecoveryCode(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Verifies a password reset token and returns the corresponding user if valid and unexpired.
 */
export async function verifyPasswordResetToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [userId, email, expiresAtStr, signature] = decoded.split(":");

    if (!userId || !email || !expiresAtStr || !signature) {
      return { valid: false, error: "Malformed reset token." };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: "Password reset link has expired. Please request a new one." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== email || !user.isActive) {
      return { valid: false, error: "Account not found or inactive." };
    }

    // Re-compute HMAC with user's current password hash
    const payload = `${userId}:${email}:${expiresAtStr}`;
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
