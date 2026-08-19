import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PromotionPlacement, PromotionTheme } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle ? body.subtitle.trim() : null }),
        ...(body.badgeText !== undefined && { badgeText: body.badgeText ? body.badgeText.trim().toUpperCase() : null }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl ? body.imageUrl.trim() : null }),
        ...(body.ctaText !== undefined && { ctaText: body.ctaText ? body.ctaText.trim() : "Shop Now" }),
        ...(body.ctaUrl !== undefined && { ctaUrl: body.ctaUrl ? body.ctaUrl.trim() : "/shop" }),
        ...(body.discountCode !== undefined && { discountCode: body.discountCode ? body.discountCode.trim().toUpperCase() : null }),
        ...(body.placement !== undefined && { placement: body.placement as PromotionPlacement }),
        ...(body.theme !== undefined && { theme: body.theme as PromotionTheme }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.showOnLogin !== undefined && { showOnLogin: Boolean(body.showOnLogin) }),
        ...(body.showOnGuest !== undefined && { showOnGuest: Boolean(body.showOnGuest) }),
        ...(body.delayMinutes !== undefined && { delayMinutes: Number(body.delayMinutes || 0) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      },
    });

    return NextResponse.json({ promotion: updated });
  } catch (error) {
    console.error("Error updating promotion:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}
