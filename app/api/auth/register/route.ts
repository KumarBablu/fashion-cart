import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/schemas";
import { rateLimit, clientKeyFromRequest } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKeyFromRequest(req, "register"), 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || undefined,
      passwordHash,
      role: email.toLowerCase() === "bablusoni2825@gmail.com" ? "ADMIN" : "CUSTOMER",
    },
  });

  await prisma.cart.create({ data: { userId: user.id } });
  await prisma.wishlist.create({ data: { userId: user.id } });

  const { rawToken, expiresAt } = await createSession(user.id, req.headers.get("user-agent"));
  await setSessionCookie(rawToken, expiresAt);

  // Send Welcome Email to customer asynchronously
  sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) => {
    console.error("Welcome email failed to dispatch:", err);
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
