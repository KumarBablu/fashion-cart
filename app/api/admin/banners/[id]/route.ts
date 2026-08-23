import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  try {
    const body = await req.json();
    const { title, subtitle, badge, linkUrl, imageUrl, buttonText, position, isActive, sortOrder } = body;

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const updated = await db.banner.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        subtitle: subtitle !== undefined ? subtitle?.trim() || null : existing.subtitle,
        badge: badge !== undefined ? badge?.trim() || null : existing.badge,
        linkUrl: linkUrl !== undefined ? linkUrl?.trim() || "/shop" : existing.linkUrl,
        imageUrl: imageUrl !== undefined ? imageUrl?.trim() || null : existing.imageUrl,
        buttonText: buttonText !== undefined ? buttonText?.trim() || "Shop Now" : existing.buttonText,
        position: position !== undefined ? position?.trim() : existing.position,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) || 0 : existing.sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      banner: updated,
      message: `Updated "${updated.title}".`,
    });
  } catch (error: any) {
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: error.message || "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  try {
    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await db.banner.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Deleted banner "${existing.title}".`,
    });
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: error.message || "Failed to delete banner" }, { status: 500 });
  }
}
