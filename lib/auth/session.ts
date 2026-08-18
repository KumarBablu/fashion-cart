import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

const SESSION_COOKIE = "fc_session";
const SESSION_TTL_DAYS = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new session for a user and returns the raw token.
 * Only the SHA-256 hash of the token is stored in the database, so a
 * database leak alone cannot be used to impersonate a session.
 */
export async function createSession(userId: string, userAgent?: string | null) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      userAgent: userAgent ?? undefined,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function setSessionCookie(rawToken: string, _expiresAt?: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Omit expires & maxAge so the browser treats this as a pure Session Cookie.
    // When the browser window is closed, the cookie is discarded, requiring a fresh login.
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getRawSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/** Resolves the current request's session to a User, or null if unauthenticated/expired. */
export async function getCurrentUser(): Promise<User | null> {
  const rawToken = await getRawSessionToken();
  if (!rawToken) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function destroyCurrentSession() {
  const rawToken = await getRawSessionToken();
  if (!rawToken) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
  await clearSessionCookie();
}

/** Throws-free helper: returns the user only if they are an active admin. */
export async function getCurrentAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const isSuperAdminEmail =
    user.email.toLowerCase() === "bablusoni2825@gmail.com" ||
    user.email.toLowerCase() === "admin@fashioncart.shop";

  if (user.role !== "ADMIN" && !isSuperAdminEmail) return null;
  return user;
}
