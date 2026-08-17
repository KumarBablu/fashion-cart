import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "ADMIN"]).default("CUSTOMER"),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const role = req.nextUrl.searchParams.get("role");
  const status = req.nextUrl.searchParams.get("status");

  const customers = await prisma.user.findMany({
    where: {
      ...(role && role !== "ALL" ? { role: role as "CUSTOMER" | "ADMIN" } : {}),
      ...(status === "ACTIVE" ? { isActive: true } : status === "BLOCKED" ? { isActive: false } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      isActive: true,
      _count: { select: { orders: true } },
      orders: { select: { total: true } },
    },
  });

  const withTotals = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    role: c.role,
    registrationDate: c.createdAt,
    isActive: c.isActive,
    numberOfOrders: c._count.orders,
    totalOrdersValue: c.orders.reduce((sum, o) => sum + o.total.toNumber(), 0),
  }));

  return NextResponse.json({ customers: withTotals });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const { name, email, phone, password, role, isActive } = parsed.data;

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "A user with this email address already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash,
      role,
      isActive,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ customer: newUser }, { status: 201 });
}
