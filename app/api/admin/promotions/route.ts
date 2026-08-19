import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PromotionPlacement, PromotionTheme } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ promotions });
  } catch (error) {
    console.error("Error loading admin promotions:", error);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      badgeText,
      imageUrl,
      ctaText,
      ctaUrl,
      discountCode,
      placement,
      theme,
      isActive,
      showOnLogin,
      showOnGuest,
      sortOrder,
      startDate,
      endDate,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Promotion title is required" }, { status: 400 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        badgeText: badgeText ? badgeText.trim().toUpperCase() : null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        ctaText: ctaText ? ctaText.trim() : "Shop Now",
        ctaUrl: ctaUrl ? ctaUrl.trim() : "/shop",
        discountCode: discountCode ? discountCode.trim().toUpperCase() : null,
        placement: (placement as PromotionPlacement) || "TOP_BANNER",
        theme: (theme as PromotionTheme) || "FESTIVE_GOLD",
        isActive: typeof isActive === "boolean" ? isActive : true,
        showOnLogin: typeof showOnLogin === "boolean" ? showOnLogin : false,
        showOnGuest: typeof showOnGuest === "boolean" ? showOnGuest : true,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
