import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

const LOW_STOCK_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = req.nextUrl.searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todaysOrders, ordersCount, pendingPayments, lowStockCount, recentOrders, pendingPaymentsList] =
    await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: startOfToday }, status: { notIn: ["CANCELLED", "REFUNDED", "REFUND_PENDING"] } },
        select: { total: true },
      }),
      db.order.count(),
      db.payment.count({ where: { status: "UNDER_REVIEW" } }),
      db.productVariant.count({ where: { isActive: true, stockQuantity: { lte: LOW_STOCK_THRESHOLD } } }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: true, payment: true },
      }),
      db.payment.findMany({
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
