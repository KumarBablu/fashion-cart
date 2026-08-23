import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  try {
    const body = await req.json().catch(() => ({}));
    const status = body.status;

    if (!status || !["ACTIVE", "DRAFT", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    let updated = null;
    try {
      updated = await db.product.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, status: true },
      });
    } catch {
      // Fallback to alternative db in case store cookie was mismatched
      const altDb = getDb(store === "jewellery" ? "garments" : "jewellery");
      updated = await altDb.product.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, status: true },
      });
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message: `Status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update product status" }, { status: 500 });
  }
}
