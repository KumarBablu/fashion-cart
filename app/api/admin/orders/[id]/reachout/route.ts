import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { sendOrderReachoutEmail } from "@/lib/email/service";

/**
 * POST /api/admin/orders/[id]/reachout
 * Allows Admin to dispatch custom or template-based reachout emails directly to customer.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      subject,
      message,
      store = "garments",
      actionUrl,
      actionText,
      templateType = "CUSTOM",
    } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Email subject is required." }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Email message body is required." }, { status: 400 });
    }

    // Resolve order from the appropriate database (garments vs jewellery)
    let targetStore: "garments" | "jewellery" = store === "jewellery" ? "jewellery" : "garments";
    let db = getDb(targetStore);
    let order = await db.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: true,
        payment: true,
      },
    });

    if (!order) {
      // Fallback search in the other store
      const altStore = targetStore === "garments" ? "jewellery" : "garments";
      const altDb = getDb(altStore);
      const altOrder = await altDb.order.findUnique({
        where: { id },
        include: {
          user: true,
          items: true,
          payment: true,
        },
      });

      if (altOrder) {
        order = altOrder;
        db = altDb;
        targetStore = altStore;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const recipientEmail = order.user?.email || (order.shippingAddressSnapshot as any)?.email;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Customer does not have a valid email address on file." },
        { status: 400 }
      );
    }

    const customerName = order.user?.name || (order.shippingAddressSnapshot as any)?.fullName || "Valued Patron";
    const storeName = targetStore === "jewellery" ? "Fashion Cart Imperial Jewels Atelier" : "Fashion Cart Haute Couture";

    const emailItems = (order.items || []).map((item) => ({
      name: item.productNameSnapshot,
      quantity: item.quantity,
      size: item.sizeSnapshot || undefined,
      price: Number(item.unitPrice),
    }));

    const result = await sendOrderReachoutEmail({
      recipientEmail,
      customerName,
      orderNumber: order.orderNumber,
      subject: subject.trim(),
      message: message.trim(),
      orderStatus: order.status.replace(/_/g, " "),
      paymentStatus: order.payment?.status || undefined,
      totalAmount: Number(order.total),
      items: emailItems,
      actionUrl: actionUrl || undefined,
      actionText: actionText || undefined,
      storeName,
      sentByAdminEmail: admin.email,
    });

    return NextResponse.json({
      success: true,
      simulated: result.simulated,
      recipient: recipientEmail,
      message: "Reachout email dispatched successfully to customer.",
    });
  } catch (error: any) {
    console.error("Error in admin order email reachout:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch reachout email." },
      { status: 500 }
    );
  }
}
