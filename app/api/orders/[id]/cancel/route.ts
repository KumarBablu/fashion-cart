import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { incrementStock } from "@/lib/inventory";
import { sendOrderCancelledEmail } from "@/lib/email/service";

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

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: { items: true, payment: true, user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow cancellation if order is not yet shipped or delivered
    const cancellableStatuses = ["PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED", "PROCESSING"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel an order that is already ${order.status.toLowerCase()}.` },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason,
        },
        include: { user: true, items: true },
      });

      // 2. Restore stock for all items
      for (const item of order.items) {
        if (item.variantId) {
          await incrementStock(tx, item.variantId, item.quantity, {
            type: "CANCELLED_ORDER",
            orderId: order.id,
            notes: `Stock restored from cancelled order ${order.orderNumber}`,
          });
        }
      }

      // 3. Update Payment if under review
      if (order.payment && order.payment.status !== "VERIFIED") {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "REJECTED", rejectionReason: "Order cancelled by customer." },
        });
      }

      return updated;
    });

    // Dispatch Cancellation Confirmation Email
    sendOrderCancelledEmail(updatedOrder, reason).catch((err) => {
      console.error("Order cancelled email dispatch failed:", err);
    });

    return NextResponse.json({ success: true, message: "Order cancelled and stock restored." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
