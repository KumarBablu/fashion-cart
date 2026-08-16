import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { z } from "zod";

const rejectSchema = z.object({ reason: z.string().trim().max(500).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    const rejected = await tx.payment.update({
      where: { id },
      data: {
        status: "REJECTED",
        verifiedAt: new Date(),
        verifiedById: admin.id,
        rejectionReason: parsed.data.reason || "Payment could not be verified.",
      },
    });

    // Order remains unpaid; keep it visible in the payment-review queue so
    // the customer can resubmit a corrected screenshot/UTR.
    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "PAYMENT_REVIEW" },
    });

    return rejected;
  });

  return NextResponse.json({ payment: updated });
}
