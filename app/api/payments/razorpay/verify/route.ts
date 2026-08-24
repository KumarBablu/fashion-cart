import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";
import { sendOrderPlacedEmail, sendPaymentVerifiedEmail } from "@/lib/email/service";
import { sendMobileSms, formatOrderPlacedSms, formatPaymentVerifiedSms } from "@/lib/notifications/sms";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const {
      orderId,
      store: rawStore,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = body || {};

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify signature using RAZORPAY_KEY_SECRET
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      console.error("Razorpay signature verification failed for order:", orderId, {
        razorpayPaymentId,
        razorpayOrderId,
      });
      return NextResponse.json(
        { error: "Payment verification failed: cryptographic signature mismatch." },
        { status: 400 }
      );
    }

    // 2. Locate order across stores
    let store: "garments" | "jewellery" = rawStore === "jewellery" ? "jewellery" : "garments";
    let db = getDb(store);

    let order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { payment: true },
    });

    if (!order) {
      const altStore = store === "jewellery" ? "garments" : "jewellery";
      const altDb = getDb(altStore);
      order = await altDb.order.findFirst({
        where: { id: orderId, userId: user.id },
        include: { payment: true },
      });
      if (order) {
        store = altStore;
        db = altDb;
      }
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 3. Fetch full payment details from Razorpay to capture channel (UPI/Card/Netbanking) & instrument details
    let rzpPaymentObj: any = null;
    let gatewayName = "Razorpay";
    let paymentChannel = "ONLINE_GATEWAY";
    let instrumentDetails = "Razorpay Gateway";

    try {
      const { fetchRazorpayPayment, parseRazorpayPaymentInstrument } = await import("@/lib/payments/razorpay");
      rzpPaymentObj = await fetchRazorpayPayment(razorpayPaymentId);
      const parsed = parseRazorpayPaymentInstrument(rzpPaymentObj);
      gatewayName = parsed.gatewayName;
      paymentChannel = parsed.paymentChannel;
      instrumentDetails = parsed.instrumentDetails;
    } catch (e) {
      console.warn("Could not fetch extended Razorpay payment details:", e);
    }

    // 4. Mark payment as VERIFIED and order as CONFIRMED atomically
    await db.$transaction(async (tx) => {
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: "VERIFIED",
            utrNumber: razorpayPaymentId,
            method: "ONLINE_GATEWAY",
            gatewayName,
            paymentChannel,
            instrumentDetails,
            paymentMetadata: rzpPaymentObj ? (rzpPaymentObj as any) : undefined,
            verifiedAt: new Date(),
            rejectionReason: null,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            method: "ONLINE_GATEWAY",
            status: "VERIFIED",
            utrNumber: razorpayPaymentId,
            gatewayName,
            paymentChannel,
            instrumentDetails,
            paymentMetadata: rzpPaymentObj ? (rzpPaymentObj as any) : undefined,
            verifiedAt: new Date(),
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          paymentMethod: `ONLINE_GATEWAY (${gatewayName} · ${paymentChannel})`,
        },
      });

      // Clear customer's active cart in this store
      const userCart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }
    });

    // 4. Background tasks: PDF Tax Invoice generation and Customer Notifications
    void (async () => {
      try {
        const fullOrder = await db.order.findUnique({
          where: { id: order.id },
          include: { user: true, items: true, payment: true },
        });

        if (fullOrder) {
          // Send order placed confirmation email
          sendOrderPlacedEmail(fullOrder).catch((err) => {
            console.error("Order placed email failed to dispatch:", err);
          });

          // Generate official PDF tax invoice
          let invoiceBuffer: Buffer | undefined;
          let invoiceFilename: string | undefined;

          try {
            const { buffer, invoiceNumber } = await generateInvoiceBufferForOrder(order.id);
            invoiceBuffer = buffer;
            invoiceFilename = `FashionCart-Invoice-${order.orderNumber}-${invoiceNumber}.pdf`;
          } catch (invErr) {
            console.error("Invoice generation error on payment verification:", invErr);
          }

          // Send payment verified email with PDF attachment
          sendPaymentVerifiedEmail(fullOrder, invoiceBuffer, invoiceFilename).catch((err) => {
            console.error("Payment verified email failed to dispatch:", err);
          });

          // Send SMS notification
          const phone = fullOrder.user.phone || (fullOrder.shippingAddressSnapshot as Record<string, string> | null)?.mobileNumber;
          if (phone) {
            sendMobileSms({
              to: phone,
              message: formatPaymentVerifiedSms(fullOrder),
              templateType: "PAYMENT_VERIFIED",
            }).catch((smsErr) => {
              console.error("SMS notification failed to dispatch:", smsErr);
            });
          }
        }
      } catch (bgErr) {
        console.error("Post-verification background tasks failed:", bgErr);
      }
    })();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: razorpayPaymentId,
      status: "CONFIRMED",
    });
  } catch (err: unknown) {
    console.error("Razorpay verification endpoint error:", err);
    const message = err instanceof Error ? err.message : "Payment verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
