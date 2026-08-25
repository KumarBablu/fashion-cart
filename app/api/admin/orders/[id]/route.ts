import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { restockVariant } from "@/lib/inventory";
import { sendOrderDeliveredEmail, sendOrderShippedEmail, sendOrderCancelledEmail } from "@/lib/email/service";
import { initiateGatewayRefund } from "@/lib/payments/refunds";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAYMENT_REVIEW",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUND_PENDING",
    "REFUNDED",
  ]),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let db = getDb("garments");
  let order = await db.order.findUnique({
    where: { id },
    include: { user: true, items: true, payment: true, address: true, invoice: true },
  });

  if (!order) {
    const jwDb = getDb("jewellery");
    order = await jwDb.order.findUnique({
      where: { id },
      include: { user: true, items: true, payment: true, address: true, invoice: true },
    });
    if (order) {
      db = jwDb;
    }
  }

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  let db = getDb("garments");
  let current = await db.order.findUnique({
    where: { id },
    include: { items: true, user: true, payment: true },
  });

  if (!current) {
    const jwDb = getDb("jewellery");
    current = await jwDb.order.findUnique({
      where: { id },
      include: { items: true, user: true, payment: true },
    });
    if (current) {
      db = jwDb;
    }
  }

  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isCancelling = ["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(parsed.data.status);
  const wasNotCancelled = !["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(current.status);

  let refundData: {
    refundId?: string;
    refundStatus?: string;
    refundAmount?: number;
    refundArn?: string | null;
    refundSpeed?: string;
  } = {};

  // If cancelling a prepaid verified order that hasn't been refunded yet, trigger gateway refund
  if (
    isCancelling &&
    wasNotCancelled &&
    current.payment?.status === "VERIFIED" &&
    current.payment?.utrNumber &&
    !current.payment?.refundId
  ) {
    const refundRes = await initiateGatewayRefund({
      paymentId: current.payment.utrNumber,
      amountInRupees: Number(current.total),
      reason: `Order #${current.orderNumber} cancelled by Store Operations`,
    });

    if (refundRes.success) {
      refundData = {
        refundId: refundRes.refundId,
        refundStatus: refundRes.refundStatus || "PROCESSED",
        refundAmount: refundRes.refundAmount || Number(current.total),
        refundArn: refundRes.refundArn,
        refundSpeed: refundRes.speed || "normal",
      };
    }
  }

  const updatedOrder = await db.$transaction(async (tx) => {
    const now = new Date();
    const releasesStock = isCancelling && wasNotCancelled;

    if (releasesStock) {
      for (const item of current.items) {
        if (item.variantId) {
          await restockVariant(tx, item.variantId, item.quantity, {
            type: "CANCELLED_ORDER",
            orderId: current.id,
            notes: `Stock released: order #${current.orderNumber} set to ${parsed.data.status} by Admin`,
          });
        }
      }
    }

    if (current.payment && refundData.refundId) {
      await tx.payment.update({
        where: { id: current.payment.id },
        data: {
          refundId: refundData.refundId,
          refundStatus: refundData.refundStatus || "PROCESSED",
          refundAmount: refundData.refundAmount || Number(current.total),
          refundArn: refundData.refundArn || undefined,
          refundSpeed: refundData.refundSpeed || "normal",
          refundCreatedAt: now,
          refundCompletedAt: refundData.refundStatus === "PROCESSED" ? now : undefined,
        },
      });
    }

    return tx.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        cancelledAt: isCancelling && !current.cancelledAt ? now : undefined,
        cancellationStatus: isCancelling ? "COMPLETED" : undefined,
        cancelReason: isCancelling && !current.cancelReason ? "Cancelled by Store Operations" : undefined,
      },
      include: { user: true, items: true, payment: true },
    });
  });

  // Dispatch customer notification emails asynchronously in background
  if (parsed.data.status === "DELIVERED" && current.status !== "DELIVERED") {
    sendOrderDeliveredEmail(updatedOrder).catch((err) => console.error("Delivered email failed:", err));
  } else if (parsed.data.status === "SHIPPED" && current.status !== "SHIPPED") {
    sendOrderShippedEmail(updatedOrder).catch((err) => console.error("Shipped email failed:", err));
  } else if (parsed.data.status === "CANCELLED" && current.status !== "CANCELLED") {
    sendOrderCancelledEmail(updatedOrder, "Updated by Store Operations").catch((err) =>
      console.error("Cancelled email failed:", err)
    );
  }

  return NextResponse.json({ order: updatedOrder });
}
