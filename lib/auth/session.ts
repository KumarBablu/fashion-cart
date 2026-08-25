import { cache } from "react";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma, getDb } from "@/lib/db";
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
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getRawSessionToken(req?: NextRequest): Promise<string | undefined> {
  if (req) {
    const tokenFromReq = req.cookies.get(SESSION_COOKIE)?.value;
    if (tokenFromReq) return tokenFromReq;
  }
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

/** Resolves the current request's session to a User from either database. Memoized per request. */
export const getCurrentUser = cache(async (req?: NextRequest): Promise<User | null> => {
  const rawToken = await getRawSessionToken(req);
  if (!rawToken) return null;

  const tHash = hashToken(rawToken);

  let session = await prisma.session.findUnique({
    where: { tokenHash: tHash },
    include: { user: true },
  }).catch(() => null);

  if (!session) {
    try {
      session = await getDb("jewellery").session.findUnique({
        where: { tokenHash: tHash },
        include: { user: true },
      });
    } catch {
      // ignore
    }
  }

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
});

/**
 * Unified SSO helper: Resolves the authenticated user and automatically synchronizes
 * their profile into the target store's database (e.g. fashion-cart-jwellery) so
 * foreign keys on Cart, Orders, Reviews, and Addresses work with zero friction.
 */
export async function getStoreUser(store: string = "garments", req?: NextRequest): Promise<User | null> {
  const masterUser = await getCurrentUser(req);
  if (!masterUser) return null;

  if (store === "garments" || store === "default") {
    return masterUser;
  }

  try {
    const storeDb = getDb(store);
    const syncedUser = await storeDb.user.upsert({
      where: { id: masterUser.id },
      update: {
        name: masterUser.name,
        email: masterUser.email,
        phone: masterUser.phone,
        role: masterUser.role,
        isActive: masterUser.isActive,
      },
      create: {
        id: masterUser.id,
        name: masterUser.name,
        email: masterUser.email,
        phone: masterUser.phone,
        passwordHash: masterUser.passwordHash,
        role: masterUser.role,
        isActive: masterUser.isActive,
      },
    });
    return syncedUser;
  } catch (err) {
    console.error(`[getStoreUser] Error syncing user to store '${store}':`, err);
    return masterUser;
  }
}

export async function destroyCurrentSession(req?: NextRequest) {
  const rawToken = await getRawSessionToken(req);
  if (!rawToken) return;
  const tHash = hashToken(rawToken);
  await Promise.all([
    prisma.session.deleteMany({ where: { tokenHash: tHash } }).catch(() => {}),
    getDb("jewellery").session.deleteMany({ where: { tokenHash: tHash } }).catch(() => {}),
  ]);
  await clearSessionCookie();
}

/** Throws-free helper: returns the user only if they are an active admin. Memoized per request. */
export const getCurrentAdmin = cache(async (req?: NextRequest): Promise<User | null> => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "ADMIN" || !user.isActive) return null;
  return user;
});
