import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { sendWelcomeEmail, sendLoginAlertEmail } from "@/lib/email/service";
import { generateStandardUserId } from "@/lib/db/identifiers";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKeyFromRequest(req, "google-auth"), 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const credential = body?.credential;

  if (!credential || typeof credential !== "string") {
    return NextResponse.json({ error: "Google authorization token is required." }, { status: 400 });
  }

  try {
    // Verify Google ID Token via Google's official verification endpoint
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    
    if (!googleRes.ok) {
      return NextResponse.json({ error: "Invalid or expired Google credential." }, { status: 401 });
    }

    const payload = await googleRes.json();
    const email = payload.email?.toLowerCase()?.trim();
    const name = payload.name?.trim() || email.split("@")[0] || "Customer";
    const emailVerified = payload.email_verified === "true" || payload.email_verified === true;

    if (!email || !emailVerified) {
      return NextResponse.json({ error: "Google account email is unverified or unavailable." }, { status: 400 });
    }

    // Look up user by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    const isSuperAdminEmail =
      email === "bablusoni2825@gmail.com" || email === "admin@fashioncart.shop";

    if (!user) {
      // Auto-register customer with high-entropy random password
      const randomPassword = crypto.randomBytes(24).toString("base64");
      const passwordHash = await hashPassword(randomPassword);
      const userRole = isSuperAdminEmail ? "ADMIN" : "CUSTOMER";
      const standardId = await generateStandardUserId(userRole);

      user = await prisma.user.create({
        data: {
          id: standardId,
          name,
          email,
          passwordHash,
          role: userRole,
          isActive: true,
        },
      });

      // Initialize Cart and Wishlist
      await prisma.cart.create({ data: { userId: user.id } });
      await prisma.wishlist.create({ data: { userId: user.id } });

      // Send welcome email asynchronously
      sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) => {
        console.error("Welcome email failed on Google signup:", err);
      });
    } else {
      if (!user.isActive) {
        return NextResponse.json({ error: "This account has been deactivated. Please contact concierge support." }, { status: 403 });
      }

      if (isSuperAdminEmail && user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    }

    // Create session & set secure cookie
    const userAgent = req.headers.get("user-agent");
    const { rawToken, expiresAt } = await createSession(user.id, userAgent);
    await setSessionCookie(rawToken, expiresAt);

    // Send login alert email
    sendLoginAlertEmail({
      name: user.name,
      email: user.email,
      identifier: `Google (${user.email})`,
      userAgent,
    }).catch((err) => {
      console.error("Google login alert email failed:", err);
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: isSuperAdminEmail ? "ADMIN" : user.role,
      },
    });
  } catch (err) {
    console.error("Google authentication error:", err);
    return NextResponse.json({ error: "Failed to authenticate with Google. Please try again." }, { status: 500 });
  }
}
