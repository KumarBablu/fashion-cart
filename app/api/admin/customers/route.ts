import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q");

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
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
      createdAt: true,
      isActive: true,
      _count: { select: { orders: true } },
      orders: { select: { total: true } },
    },
  });

  // passwordHash is intentionally excluded via `select` above.
  const withTotals = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    registrationDate: c.createdAt,
    isActive: c.isActive,
    numberOfOrders: c._count.orders,
    totalOrdersValue: c.orders.reduce((sum, o) => sum + o.total.toNumber(), 0),
  }));

  return NextResponse.json({ customers: withTotals });
}
