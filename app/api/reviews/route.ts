import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(2).max(1000),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ reviews });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a review." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid review data" }, { status: 400 });
    }

    const { productId, rating, title, comment } = parsed.data;

    // Check if user is a verified buyer (has a confirmed or delivered order containing this product)
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
