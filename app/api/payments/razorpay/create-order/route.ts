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
        include: { payment: true },
      });

      if (!order) {
        // Check other store database
        const altStore = store === "jewellery" ? "garments" : "jewellery";
        order = await getDb(altStore).order.findFirst({
          where: { id: body.existingOrderId, userId: user.id },
          include: { payment: true },
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

    const totalAmount = Number(order.total);
    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid payable order amount." }, { status: 400 });
    }

    // Create official order on Razorpay servers
    const rzpOrder = await createRazorpayOrder({
      amountInRupees: totalAmount,
      receipt: order.orderNumber,
      currency: "INR",
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
        store,
      },
    });

    const { keyId } = getRazorpayCredentials();
    const addressSnapshot = order.shippingAddressSnapshot as Record<string, string> | null;

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
