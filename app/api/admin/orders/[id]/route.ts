import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { restockVariant } from "@/lib/inventory";
import { sendOrderDeliveredEmail, sendOrderShippedEmail, sendOrderCancelledEmail } from "@/lib/email/service";
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
    include: { items: true, user: true },
  });

  if (!current) {
    const jwDb = getDb("jewellery");
    current = await jwDb.order.findUnique({
      where: { id },
      include: { items: true, user: true },
    });
    if (current) {
      db = jwDb;
    }
  }

  if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updatedOrder = await db.$transaction(async (tx) => {
    const releasesStock =
      ["CANCELLED", "REFUNDED"].includes(parsed.data.status) &&
      !["CANCELLED", "REFUNDED"].includes(current.status);

    if (releasesStock) {
      for (const item of current.items) {
        if (item.variantId) {
          await restockVariant(tx, item.variantId, item.quantity, {
            type: "CANCELLED_ORDER",
            orderId: current.id,
            notes: `Stock released: order ${current.orderNumber} set to ${parsed.data.status}`,
          });
        }
      }
    }

    return tx.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { user: true, items: true },
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
