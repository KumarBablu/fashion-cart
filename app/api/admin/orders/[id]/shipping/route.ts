import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sendOrderShippedEmail } from "@/lib/email/service";
import { sendMobileSms, formatOrderShippedSms } from "@/lib/notifications/sms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { carrierName, trackingNumber } = body;

  let db = getDb("garments");
  let existing = await db.order.findUnique({ where: { id } });

  if (!existing) {
    const jwDb = getDb("jewellery");
    existing = await jwDb.order.findUnique({ where: { id } });
    if (existing) {
      db = jwDb;
    }
  }

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await db.order.update({
    where: { id },
    data: {
      carrierName: carrierName || null,
      trackingNumber: trackingNumber || null,
      status: trackingNumber ? "SHIPPED" : undefined,
    },
    include: { user: true, items: true },
  });

  // Dispatch live tracking & shipping email & SMS to customer
  if (trackingNumber) {
    sendOrderShippedEmail(order).catch((err) => {
      console.error("Order shipped email dispatch failed:", err);
    });

    const phone = order.user.phone || (order.shippingAddressSnapshot as any)?.mobileNumber;
    if (phone) {
      sendMobileSms({
        to: phone,
        message: formatOrderShippedSms(order),
        templateType: "ORDER_SHIPPED",
      }).catch((err) => {
        console.error("Order shipped SMS dispatch failed:", err);
      });
    }
  }

  return NextResponse.json({ order });
}
