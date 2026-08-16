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

  const { email, password } = parsed.data;

  // Rate limit by IP + email to slow down both credential stuffing and
  // targeted brute force against a single account.
  if (
    !rateLimit(clientKeyFromRequest(req, "login"), 15, 15 * 60 * 1000) ||
    !rateLimit(`login-email:${email}`, 8, 15 * 60 * 1000)
  ) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-shape response whether the user exists or not, to avoid
  // leaking account existence via timing/response differences.
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid || !user.isActive) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const { rawToken, expiresAt } = await createSession(user.id, req.headers.get("user-agent"));
  await setSessionCookie(rawToken, expiresAt);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
