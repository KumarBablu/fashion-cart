import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { PromotionPlacement } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placementParam = searchParams.get("placement");
    const storeParam = searchParams.get("store") || req.cookies.get("fc_store")?.value || "garments";
    const db = getDb(storeParam === "jewellery" ? "jewellery" : "garments");

    const user = await getCurrentUser();
    const isLoggedIn = !!user;

    const now = new Date();

    const whereClause: any = {
      isActive: true,
      AND: [
        {
          OR: [
            { startDate: null, endDate: null },
            { startDate: { lte: now }, endDate: null },
            { startDate: null, endDate: { gte: now } },
            { startDate: { lte: now }, endDate: { gte: now } },
          ],
        },
      ],
    };

    if (placementParam && Object.values(PromotionPlacement).includes(placementParam as PromotionPlacement)) {
      whereClause.placement = placementParam as PromotionPlacement;
    }

    // Audience event filtering (Guest vs Logged-In Customer)
    if (isLoggedIn) {
      whereClause.AND.push({
        OR: [
          { showOnLogin: true },
          { AND: [{ showOnGuest: true }, { showOnLogin: true }] },
        ],
      });
    } else {
      whereClause.AND.push({
        showOnGuest: true,
      });
    }

    const promotions = await db.promotion.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return NextResponse.json({ promotions: [] });
  }
}
