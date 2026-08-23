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
  const status = body.status; // "APPROVED" or "REJECTED"

  const review = await db.review.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ review });
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

  await db.review.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
