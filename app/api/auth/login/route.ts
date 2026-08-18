import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

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
    if (phoneDigits.length >= 7) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phoneDigits },
            { phone: `+91${phoneDigits}` },
            { phone: { contains: phoneDigits } },
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
    return NextResponse.json({ error: "Invalid email/mobile number or password." }, { status: 401 });
  }

  const isSuperAdminEmail =
    user.email.toLowerCase() === "bablusoni2825@gmail.com" ||
    user.email.toLowerCase() === "admin@fashioncart.shop";

  const effectiveRole = isSuperAdminEmail ? "ADMIN" : user.role;

  if (isSuperAdminEmail && user.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  const { rawToken, expiresAt } = await createSession(user.id, req.headers.get("user-agent"));
  await setSessionCookie(rawToken, expiresAt);

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
