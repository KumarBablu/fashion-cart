import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

const LOW_STOCK_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusFilter = req.nextUrl.searchParams.get("status"); // IN_STOCK | LOW_STOCK | OUT_OF_STOCK

  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    orderBy: { stockQuantity: "asc" },
    include: { product: { select: { name: true, slug: true } } },
  });

  const withStatus = variants.map((v) => ({
    ...v,
    stockStatus:
      v.stockQuantity === 0 ? "OUT_OF_STOCK" : v.stockQuantity <= LOW_STOCK_THRESHOLD ? "LOW_STOCK" : "IN_STOCK",
  }));

  const filtered = statusFilter ? withStatus.filter((v) => v.stockStatus === statusFilter) : withStatus;

  return NextResponse.json({ variants: filtered, lowStockThreshold: LOW_STOCK_THRESHOLD });
}
