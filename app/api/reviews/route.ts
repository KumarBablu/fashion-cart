import { NextRequest, NextResponse } from "next/server";
import { getDb, prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(2).max(1500),
  fitRating: z.enum(["RUNS_SMALL", "TRUE_TO_SIZE", "RUNS_LARGE"]).optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
  colorAccuracy: z.enum(["EXACT_MATCH", "SLIGHT_VARIATION", "VERY_DIFFERENT"]).optional(),
  comfortRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  sizePurchased: z.string().max(30).optional(),
  occasionWorn: z.string().max(50).optional(),
  recommend: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const storeParam = searchParams.get("store") || "garments";
    const store = storeParam === "jewellery" ? "jewellery" : "garments";

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const db = getDb(store);
    let reviews = await db.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        fitRating: true,
        qualityRating: true,
        colorAccuracy: true,
        comfortRating: true,
        valueRating: true,
        sizePurchased: true,
        occasionWorn: true,
        recommend: true,
        isVerifiedBuyer: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    if (reviews.length === 0 && store === "garments") {
      // Fallback check in jewellery database
      try {
        const altReviews = await getDb("jewellery").review.findMany({
          where: { productId, status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            title: true,
            comment: true,
            fitRating: true,
            qualityRating: true,
            colorAccuracy: true,
            comfortRating: true,
            valueRating: true,
            sizePurchased: true,
            occasionWorn: true,
            recommend: true,
            isVerifiedBuyer: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        });
        if (altReviews.length > 0) {
          reviews = altReviews;
        }
      } catch {}
    }

    // Compute aggregated survey scorecard
    const totalReviews = reviews.length;
    let fitStats = { runsSmall: 0, trueToSize: 0, runsLarge: 0 };
    let totalQuality = 0;
    let totalComfort = 0;
    let totalValue = 0;
    let recommendedCount = 0;
    let exactColorCount = 0;
    let countWithQuality = 0;

    reviews.forEach((r) => {
      if (r.fitRating === "RUNS_SMALL") fitStats.runsSmall++;
      else if (r.fitRating === "RUNS_LARGE") fitStats.runsLarge++;
      else if (r.fitRating === "TRUE_TO_SIZE") fitStats.trueToSize++;

      if (r.qualityRating) {
        totalQuality += r.qualityRating;
        countWithQuality++;
      }
      if (r.comfortRating) totalComfort += r.comfortRating;
      if (r.valueRating) totalValue += r.valueRating;
      if (r.recommend !== false) recommendedCount++;
      if (r.colorAccuracy === "EXACT_MATCH") exactColorCount++;
    });

    const surveySummary = {
      total: totalReviews,
      recommendPercent: totalReviews > 0 ? Math.round((recommendedCount / totalReviews) * 100) : 98,
      colorAccuracyPercent: totalReviews > 0 ? Math.round((exactColorCount / totalReviews) * 100) : 96,
      avgQuality: countWithQuality > 0 ? (totalQuality / countWithQuality).toFixed(1) : "4.9",
      avgComfort: totalReviews > 0 ? (totalComfort / totalReviews).toFixed(1) : "4.8",
      avgValue: totalReviews > 0 ? (totalValue / totalReviews).toFixed(1) : "4.9",
      fitDistribution: {
        runsSmall: fitStats.runsSmall,
        trueToSize: fitStats.trueToSize,
        runsLarge: fitStats.runsLarge,
      },
    };

    return NextResponse.json(
      { reviews, surveySummary },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a verified product review." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid review data" }, { status: 400 });
    }

    const {
      productId,
      rating,
      title,
      comment,
      fitRating,
      qualityRating,
      colorAccuracy,
      comfortRating,
      valueRating,
      sizePurchased,
      occasionWorn,
      recommend,
    } = parsed.data;

    // Check if user is a verified buyer
    const verifiedOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
          status: { in: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"] },
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating,
        title,
        comment,
        fitRating: fitRating || "TRUE_TO_SIZE",
        qualityRating: qualityRating || rating,
        colorAccuracy: colorAccuracy || "EXACT_MATCH",
        comfortRating: comfortRating || rating,
        valueRating: valueRating || rating,
        sizePurchased: sizePurchased || undefined,
        occasionWorn: occasionWorn || undefined,
        recommend: recommend ?? true,
        isVerifiedBuyer: !!verifiedOrder,
        status: "APPROVED",
      },
    });

    // Update product averageRating & totalReviews
    const allReviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      select: { rating: true },
    });

    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: avg,
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
