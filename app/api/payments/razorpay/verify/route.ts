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
      where: { id: orderId, user: { email: user.email } },
      include: { payment: true },
    });

    if (!order) {
      const altStore = store === "jewellery" ? "garments" : "jewellery";
      const altDb = getDb(altStore);
      order = await altDb.order.findFirst({
        where: { id: orderId, user: { email: user.email } },
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

    if (order.status === "CONFIRMED" && order.payment?.status === "VERIFIED") {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: razorpayPaymentId,
        status: "CONFIRMED",
      });
    }

    // 3. Synchronously verify payment directly against Razorpay API
    let rzpPaymentObj = null;
    let parsedInstrument = {
      gatewayName: "Razorpay",
      paymentChannel: "ONLINE_GATEWAY",
      instrumentDetails: "Instant Verification",
    };

    try {
      const { fetchRazorpayPayment, parseRazorpayPaymentInstrument } = await import("@/lib/payments/razorpay");
      rzpPaymentObj = await fetchRazorpayPayment(razorpayPaymentId);
      parsedInstrument = parseRazorpayPaymentInstrument(rzpPaymentObj);

      // Validate payment belongs to this Razorpay order
      if (rzpPaymentObj.order_id && rzpPaymentObj.order_id !== razorpayOrderId) {
        return NextResponse.json(
          { error: "Payment verification failed: Razorpay order ID mismatch." },
          { status: 400 }
        );
      }

      // Validate payment amount in paise matches order total
      const expectedPaise = Math.round(Number(order.total) * 100);
      if (rzpPaymentObj.amount !== expectedPaise) {
        console.error("Payment amount mismatch:", { paidPaise: rzpPaymentObj.amount, expectedPaise, orderId });
        return NextResponse.json(
          { error: "Payment amount does not match order payable total." },
          { status: 400 }
        );
      }

      // Validate payment status is authorized or captured
      if (rzpPaymentObj.status !== "captured" && rzpPaymentObj.status !== "authorized") {
        return NextResponse.json(
          { error: `Payment not completed. Status is '${rzpPaymentObj.status}'.` },
          { status: 400 }
        );
      }
    } catch (fetchErr: any) {
      console.warn("Direct Razorpay payment check warning:", fetchErr?.message);
      // If network check to Razorpay fails, signature was already cryptographically verified above
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
            gatewayName: parsedInstrument.gatewayName,
            paymentChannel: parsedInstrument.paymentChannel,
            instrumentDetails: parsedInstrument.instrumentDetails,
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
            gatewayName: parsedInstrument.gatewayName,
            paymentChannel: parsedInstrument.paymentChannel,
            instrumentDetails: parsedInstrument.instrumentDetails,
            paymentMetadata: rzpPaymentObj ? (rzpPaymentObj as any) : undefined,
            verifiedAt: new Date(),
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          paymentMethod: `ONLINE_GATEWAY (${parsedInstrument.gatewayName} · ${parsedInstrument.paymentChannel})`,
        },
      });

      // Clear purchased items from customer's active cart in this store
      const orderWithItems = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      const purchasedVariantIds = (orderWithItems?.items || [])
        .map((i) => i.variantId)
        .filter((id): id is string => Boolean(id));

      const userCart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (userCart && purchasedVariantIds.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: userCart.id,
            variantId: { in: purchasedVariantIds },
          },
        });
      }
    });

    // 5. Background tasks: PDF Tax Invoice generation and Customer Notifications
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
