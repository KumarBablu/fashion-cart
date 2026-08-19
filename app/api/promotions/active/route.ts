import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PromotionPlacement } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placementParam = searchParams.get("placement");

    const now = new Date();

    const whereClause: any = {
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    };

    if (placementParam && Object.values(PromotionPlacement).includes(placementParam as PromotionPlacement)) {
      whereClause.placement = placementParam as PromotionPlacement;
    }

    const promotions = await prisma.promotion.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return NextResponse.json({ promotions: [] });
  }
}
