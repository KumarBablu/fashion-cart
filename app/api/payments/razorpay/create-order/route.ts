import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { createOrder, CheckoutError } from "@/lib/orders/create-order";
import { createRazorpayOrder, getRazorpayCredentials } from "@/lib/payments/razorpay";
import { checkoutSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Please log in to proceed with payment." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const store = (body?.store === "jewellery" ? "jewellery" : "garments") as "garments" | "jewellery";
    const db = getDb(store);

    let order;

    // Check if an existing pending order ID was passed (e.g. from payment desk retry)
    if (body?.existingOrderId) {
      order = await db.order.findFirst({
        where: { id: body.existingOrderId, userId: user.id },
        include: { payment: true, items: true, user: true },
      });

      if (!order) {
        // Check other store database
        const altStore = store === "jewellery" ? "garments" : "jewellery";
        order = await getDb(altStore).order.findFirst({
          where: { id: body.existingOrderId, userId: user.id },
          include: { payment: true, items: true, user: true },
        });
      }

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      if (order.status === "CONFIRMED" || order.payment?.status === "VERIFIED") {
        return NextResponse.json({ error: "This order is already paid and confirmed." }, { status: 400 });
      }
    } else {
      // Validate checkout form input
      const parsed = checkoutSchema.safeParse({
        addressId: body?.addressId,
        couponCode: body?.couponCode,
        customerNotes: body?.customerNotes,
        paymentMethod: "ONLINE_GATEWAY",
        variantId: body?.variantId,
        quantity: body?.quantity,
        store,
      });

      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid checkout details." }, { status: 400 });
      }

      // Create new order with ONLINE_GATEWAY payment method
      order = await createOrder(user.id, parsed.data.addressId, {
        couponCode: parsed.data.couponCode,
        paymentMethod: "ONLINE_GATEWAY",
        customerNotes: parsed.data.customerNotes,
        store,
        variantId: parsed.data.variantId,
        quantity: parsed.data.quantity,
      });
    }

    // Fetch full order with items for rich metadata
    const fullOrder = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true, user: true },
    });

    const totalAmount = Number(order.total);
    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid payable order amount." }, { status: 400 });
    }

    const addressSnapshot = (fullOrder?.shippingAddressSnapshot || order.shippingAddressSnapshot) as Record<string, string> | null;
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://fashioncartstore.vercel.app";

    // Format rich items summary for the Razorpay transaction dashboard
    const itemsSummary = fullOrder?.items?.length
      ? fullOrder.items
          .map((it) => `${it.productNameSnapshot} (${it.sizeSnapshot || "Std"}) × ${it.quantity}`)
          .join(", ")
          .slice(0, 240)
      : "Boutique Items";

    // Create official order on Razorpay servers with comprehensive metadata
    const rzpOrder = await createRazorpayOrder({
      amountInRupees: totalAmount,
      receipt: order.orderNumber.slice(0, 40),
      currency: "INR",
      notes: {
        orderNumber: order.orderNumber,
        store: store === "jewellery" ? "Jewellery Atelier" : "Garments Boutique",
        customerName: (addressSnapshot?.fullName || user.name || "Customer").slice(0, 50),
        customerPhone: (addressSnapshot?.mobileNumber || user.phone || "").slice(0, 20),
        customerEmail: user.email.slice(0, 50),
        deliveryCity: (addressSnapshot?.city || "").slice(0, 40),
        deliveryState: (addressSnapshot?.state || "").slice(0, 40),
        pinCode: (addressSnapshot?.pinCode || "").slice(0, 10),
        itemsSummary,
        itemCount: String(fullOrder?.items?.length || 1),
        adminOrderUrl: `${appUrl}/admin/orders/${order.id}`,
        invoiceRef: `INV-${order.orderNumber}`,
      },
    });

    // Save Razorpay order ID to payment record for integrity verification
    await db.payment.updateMany({
      where: { orderId: order.id },
      data: {
        paymentMetadata: {
          razorpayOrderId: rzpOrder.id,
          orderNumber: order.orderNumber,
          store,
        },
      },
    });

    const { keyId } = getRazorpayCredentials();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      store,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency,
      keyId,
      customer: {
        name: addressSnapshot?.fullName || user.name || "Customer",
        email: user.email,
        phone: addressSnapshot?.mobileNumber || user.phone || "",
      },
    });
  } catch (err: unknown) {
    console.error("Razorpay order creation error:", err);
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to initialize payment gateway.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
