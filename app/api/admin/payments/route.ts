import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "UNDER_REVIEW";

  const payments = await prisma.payment.findMany({
    where: { status: status as never },
    orderBy: { submittedAt: "asc" },
    include: { order: { include: { user: true } } },
  });

  return NextResponse.json({ payments });
}
