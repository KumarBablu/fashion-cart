import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { incrementStock } from "@/lib/inventory";
import { sendOrderCancelledEmail } from "@/lib/email/service";
import { initiateGatewayRefund } from "@/lib/payments/refunds";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || "Cancelled by customer";
    const notes = body?.notes || "";

    let store: "garments" | "jewellery" = "garments";
    let db = getDb("garments");
    let order = await db.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true, payment: true, user: true },
    });

    if (!order) {
      const jwDb = getDb("jewellery");
      order = await jwDb.order.findFirst({
        where: { id, userId: user.id },
        include: { items: true, payment: true, user: true },
      });
      if (order) {
        store = "jewellery";
        db = jwDb;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. Scenario Check: If already Shipped or Delivered, self-cancellation is disallowed
    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return NextResponse.json(
        {
          error: `This order is already ${order.status.toLowerCase()} and cannot be cancelled self-service. You may refuse delivery at your doorstep or initiate a return once received.`,
        },
        { status: 400 }
      );
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return NextResponse.json(
        { error: "This order is already cancelled." },
        { status: 400 }
      );
    }

    const isPrepaidVerified =
      order.payment?.status === "VERIFIED" &&
      Boolean(order.payment?.utrNumber);

    let refundInfo: {
      refundId?: string;
      refundStatus?: string;
      refundAmount?: number;
      refundArn?: string | null;
      refundSpeed?: string;
    } = {};

    // 2. Scenario Check: If paid online via Secure Gateway, trigger automated source-account refund
    if (isPrepaidVerified && order.payment?.utrNumber) {
      const paymentRef = order.payment.utrNumber;
      const amountToRefund = Number(order.total);

      // Trigger gateway refund API
      const refundRes = await initiateGatewayRefund({
        paymentId: paymentRef,
        amountInRupees: amountToRefund,
        reason: `Order #${order.orderNumber} cancelled by customer: ${reason}`,
      });

      if (refundRes.success) {
        refundInfo = {
          refundId: refundRes.refundId,
          refundStatus: refundRes.refundStatus || "PROCESSED",
          refundAmount: refundRes.refundAmount || amountToRefund,
          refundArn: refundRes.refundArn,
          refundSpeed: refundRes.speed || "normal",
        };
      } else {
        // If gateway refund fails immediately, flag as INITIATED for automated retry / billing review
        console.warn("[Order Cancel] Gateway refund returned non-success:", refundRes.error);
        refundInfo = {
          refundStatus: "INITIATED",
          refundAmount: amountToRefund,
        };
      }
    }

    // 3. Execute Atomic Database Update: Cancel Order + Restore Variant Stock + Update Payment & Refund
    const updatedOrder = await db.$transaction(async (tx) => {
      const now = new Date();

      // 3A. Update Order Status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: isPrepaidVerified
            ? (refundInfo.refundStatus === "PROCESSED" ? "REFUNDED" : "REFUND_PENDING")
            : "CANCELLED",
          cancelledAt: now,
          cancelRequestedAt: now,
          cancelReason: reason,
          cancellationStatus: "COMPLETED",
          cancellationNotes: notes,
        },
        include: { user: true, items: true, payment: true },
      });

      // 3B. Restore stock atomically for all ordered items
      for (const item of order.items) {
        if (item.variantId) {
          await incrementStock(tx, item.variantId, item.quantity, {
            type: "CANCELLED_ORDER",
            orderId: order.id,
            notes: `Stock restored from cancelled order #${order.orderNumber}`,
          });
        }
      }

      // 3C. Update Payment Record with Refund Data
      if (order.payment) {
        if (isPrepaidVerified) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              refundId: refundInfo.refundId || undefined,
              refundStatus: refundInfo.refundStatus || "INITIATED",
              refundAmount: refundInfo.refundAmount || Number(order.total),
              refundArn: refundInfo.refundArn || undefined,
              refundSpeed: refundInfo.refundSpeed || "normal",
              refundNotes: `Customer cancellation refund: ${reason}`,
              refundCreatedAt: now,
              refundCompletedAt: refundInfo.refundStatus === "PROCESSED" ? now : undefined,
            },
          });
        } else if (order.payment.status !== "VERIFIED") {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: "REJECTED",
              rejectionReason: `Order cancelled before payment verification: ${reason}`,
            },
          });
        }
      }

      return updated;
    });

    // 4. Dispatch Customer Cancellation Confirmation Email
    sendOrderCancelledEmail(updatedOrder, reason).catch((err) => {
      console.error("Order cancelled email dispatch failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: isPrepaidVerified
        ? `Order cancelled. Refund of ₹${order.total} initiated to your original payment source.`
        : "Order cancelled successfully and reserved items restored to inventory.",
      refund: refundInfo,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal cancellation error";
    console.error("[Order Cancel Error]:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
