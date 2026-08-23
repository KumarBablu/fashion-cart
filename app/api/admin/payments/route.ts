import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const cookieStore = req.cookies.get("fc_admin_store")?.value;
  const store = sp.get("store") === "jewellery" || (!sp.get("store") && cookieStore === "jewellery") ? "jewellery" : "garments";
  const { getDb } = await import("@/lib/db");
  const db = getDb(store);

  const status = req.nextUrl.searchParams.get("status") ?? "UNDER_REVIEW";

  const payments = await db.payment.findMany({
    where: { status: status as never },
    orderBy: { submittedAt: "asc" },
    include: { order: { include: { user: true } } },
  });

  return NextResponse.json({ payments, store });
}
