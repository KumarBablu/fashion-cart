import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, order: { userId: user.id } },
    include: { order: true },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  return NextResponse.json({ payment });
}
