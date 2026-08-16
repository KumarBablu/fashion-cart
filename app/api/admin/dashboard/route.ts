import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todaysOrders, ordersCount, pendingPayments, lowStockCount, recentOrders, pendingPaymentsList] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday }, status: { notIn: ["CANCELLED"] } },
        select: { total: true },
      }),
      prisma.order.count(),
      prisma.payment.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.productVariant.count({ where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: true, payment: true },
      }),
      prisma.payment.findMany({
        where: { status: "UNDER_REVIEW" },
        orderBy: { submittedAt: "asc" },
        take: 10,
        include: { order: { include: { user: true } } },
      }),
    ]);

  const todaysSales = todaysOrders.reduce((sum, o) => sum + o.total.toNumber(), 0);

  return NextResponse.json({
    todaysSales,
    ordersCount,
    pendingPayments,
    lowStockCount,
    recentOrders,
    pendingPaymentsList,
  });
}
