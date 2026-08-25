import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { sendLoginAlertEmail, sendFailedLoginAlertEmail } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const rawId = (parsed.data.identifier || parsed.data.email || "").trim();
  const password = parsed.data.password;

  if (!rawId) {
    return NextResponse.json(
      { error: "Please enter your email address or mobile number." },
      { status: 400 }
    );
  }

  // Rate limit by IP + identifier
  if (
    !rateLimit(clientKeyFromRequest(req, "login"), 20, 15 * 60 * 1000) ||
    !rateLimit(`login-id:${rawId.toLowerCase()}`, 10, 15 * 60 * 1000)
  ) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let user = null;

  // If identifier has @, query by email
  if (rawId.includes("@")) {
    user = await prisma.user.findUnique({
      where: { email: rawId.toLowerCase() },
    });
  } else {
    // Treat as phone number (or alphanumeric username fallback)
    const phoneDigits = rawId.replace(/\D/g, "").slice(-10);
    if (phoneDigits.length === 10) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneDigits },
            { phone: `+91${phoneDigits}` },
            { email: rawId.toLowerCase() },
          ],
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email: rawId.toLowerCase() },
      });
    }
  }

  // Constant-shape response whether the user exists or not
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid || !user.isActive) {
    if (user && !valid) {
      // Unauthorized/failed password attempt detected: notify the account owner asynchronously
      sendFailedLoginAlertEmail({
        name: user.name,
        email: user.email,
        identifier: rawId,
        userAgent: req.headers.get("user-agent"),
      }).catch((err) => {
        console.error("Failed login alert dispatch error:", err);
      });
    }

    return NextResponse.json({ error: "Invalid email/mobile number or password." }, { status: 401 });
  }

  const effectiveRole = user.role;

  const userAgent = req.headers.get("user-agent");
  const { rawToken, expiresAt } = await createSession(user.id, userAgent);
  await setSessionCookie(rawToken, expiresAt);

  // Dispatch Login Alert Email asynchronously
  sendLoginAlertEmail({
    name: user.name,
    email: user.email,
    identifier: rawId,
    userAgent,
  }).catch((err) => {
    console.error("Login alert email dispatch failed:", err);
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: effectiveRole,
    },
  });
}
