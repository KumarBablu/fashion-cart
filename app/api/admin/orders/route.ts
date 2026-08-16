import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const paymentStatus = sp.get("paymentStatus");
  const from = sp.get("from");
  const to = sp.get("to");
  const q = sp.get("q");
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = 25;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as Prisma.OrderWhereInput["status"] } : {}),
    ...(paymentStatus ? { payment: { status: paymentStatus as never } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: true, payment: true, items: true },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
}
