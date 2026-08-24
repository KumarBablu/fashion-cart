import { NextRequest, NextResponse } from "next/server";
import { getCachedPromotions } from "@/lib/data/cache";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placementParam = searchParams.get("placement");
    const storeParam = searchParams.get("store") || req.cookies.get("fc_store")?.value || "garments";
    const store = storeParam === "jewellery" ? "jewellery" : "garments";

    const [allPromotions, user] = await Promise.all([
      getCachedPromotions(store),
      getCurrentUser(req),
    ]);

    const isLoggedIn = !!user;
    const now = new Date();

    const filtered = allPromotions.filter((promo) => {
      if (!promo.isActive) return false;

      // Placement filter
      if (placementParam && promo.placement !== placementParam) {
        return false;
      }

      // Date range filter
      if (promo.startDate && new Date(promo.startDate) > now) return false;
      if (promo.endDate && new Date(promo.endDate) < now) return false;

      // Audience filter
      if (isLoggedIn) {
        if (!promo.showOnLogin && !promo.showOnGuest) return false;
      } else {
        if (!promo.showOnGuest) return false;
      }

      return true;
    });

    return NextResponse.json(
      { promotions: filtered },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return NextResponse.json({ promotions: [] });
  }
}
