import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sendOrderShippedEmail } from "@/lib/email/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { carrierName, trackingNumber } = body;

  const order = await prisma.order.update({
    where: { id },
    data: {
      carrierName: carrierName || null,
      trackingNumber: trackingNumber || null,
      status: trackingNumber ? "SHIPPED" : undefined,
    },
    include: { user: true, items: true },
  });

  // Dispatch live tracking & shipping email to customer
  if (trackingNumber) {
    sendOrderShippedEmail(order).catch((err) => {
      console.error("Order shipped email dispatch failed:", err);
    });
  }

  return NextResponse.json({ order });
}
