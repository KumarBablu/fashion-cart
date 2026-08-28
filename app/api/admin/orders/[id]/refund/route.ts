import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { initiateGatewayRefund } from "@/lib/payments/refunds";
import { sendOrderCancelledEmail } from "@/lib/email/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || "Admin initiated refund";

    let store: "garments" | "jewellery" = "garments";
    let db = getDb("garments");
    let order = await db.order.findUnique({
      where: { id },
      include: { items: true, payment: true, user: true },
    });

    if (!order) {
      const jwDb = getDb("jewellery");
      order = await jwDb.order.findUnique({
        where: { id },
        include: { items: true, payment: true, user: true },
      });
      if (order) {
        store = "jewellery";
        db = jwDb;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (!order.payment || order.payment.status !== "VERIFIED") {
      return NextResponse.json(
        { error: "Cannot refund an order without a verified payment." },
        { status: 400 }
      );
    }

    if (!order.payment.utrNumber) {
      return NextResponse.json(
        { error: "Missing gateway payment transaction ID (UTR/Payment ID) to refund." },
        { status: 400 }
      );
    }

    const amountToRefund = Number(order.total);

    // Call Razorpay Refund API
    const refundRes = await initiateGatewayRefund({
      paymentId: order.payment.utrNumber,
      amountInRupees: amountToRefund,
      reason: `Admin refund for Order #${order.orderNumber}: ${reason}`,
    });

    if (!refundRes.success) {
      return NextResponse.json(
        { error: refundRes.error || "Gateway refund request failed." },
        { status: 400 }
      );
    }

    const now = new Date();
    const refundStatus = refundRes.refundStatus || "PROCESSED";

    // Update database inside transaction
    const updated = await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          refundId: refundRes.refundId,
          refundStatus,
          refundAmount: refundRes.refundAmount || amountToRefund,
          refundArn: refundRes.refundArn || undefined,
          refundSpeed: refundRes.speed || "optimum",
          refundCreatedAt: now,
          refundCompletedAt: refundStatus === "PROCESSED" ? now : undefined,
          refundNotes: reason,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: refundStatus === "PROCESSED" ? "REFUNDED" : "REFUND_PENDING",
          cancelledAt: order.cancelledAt || now,
          cancellationStatus: "COMPLETED",
          cancelReason: order.cancelReason || reason,
        },
        include: { user: true, items: true, payment: true },
      });
    });

    // Notify customer via email
    sendOrderCancelledEmail(updated, `Refund processed: ${reason}`).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${amountToRefund} processed successfully via gateway.`,
      refund: {
        refundId: refundRes.refundId,
        refundStatus,
        refundArn: refundRes.refundArn,
        refundAmount: amountToRefund,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal refund processing error";
    console.error("[Admin Refund Error]:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
