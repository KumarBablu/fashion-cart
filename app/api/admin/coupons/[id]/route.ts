import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  const body = await req.json().catch(() => ({}));

  const coupon = await db.coupon.update({
    where: { id },
    data: {
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    },
  });

  return NextResponse.json({ coupon });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") || req.cookies.get("fc_admin_store")?.value || "garments";
  const db = getDb(store === "jewellery" ? "jewellery" : "garments");

  await db.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
