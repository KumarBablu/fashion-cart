import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";
import { sendOrderPlacedEmail, sendPaymentVerifiedEmail } from "@/lib/email/service";
import { sendMobileSms, formatPaymentVerifiedSms } from "@/lib/notifications/sms";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.warn("Invalid Razorpay webhook signature received.");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event;

    // Handle payment.captured and order.paid events
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;

      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const notes = paymentEntity?.notes || orderEntity?.notes || {};

      const orderNumber = notes.orderNumber || paymentEntity?.description || orderEntity?.receipt;
      const orderId = notes.orderId;
      const rawStore = notes.store;

      let store: "garments" | "jewellery" = rawStore === "jewellery" ? "jewellery" : "garments";
      let db = getDb(store);

      let order = null;
      if (orderId) {
        order = await db.order.findUnique({ where: { id: orderId }, include: { payment: true, user: true } });
      } else if (orderNumber) {
        order = await db.order.findUnique({ where: { orderNumber }, include: { payment: true, user: true } });
      }

      if (!order) {
        const altStore = store === "jewellery" ? "garments" : "jewellery";
        const altDb = getDb(altStore);
        if (orderId) {
          order = await altDb.order.findUnique({ where: { id: orderId }, include: { payment: true, user: true } });
        } else if (orderNumber) {
          order = await altDb.order.findUnique({ where: { orderNumber }, include: { payment: true, user: true } });
        }
        if (order) {
          store = altStore;
          db = altDb;
        }
      }

      if (order) {
        // If order was already confirmed by the frontend verify callback, nothing more needed
        if (order.status === "CONFIRMED" && order.payment?.status === "VERIFIED") {
          return NextResponse.json({ status: "already_confirmed" });
        }

        const { parseRazorpayPaymentInstrument } = await import("@/lib/payments/razorpay");
        const parsed = parseRazorpayPaymentInstrument(paymentEntity);

        await db.$transaction(async (tx) => {
          if (order.payment) {
            await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                status: "VERIFIED",
                utrNumber: razorpayPaymentId || order.payment.utrNumber,
                method: "ONLINE_GATEWAY",
                gatewayName: parsed.gatewayName,
                paymentChannel: parsed.paymentChannel,
                instrumentDetails: parsed.instrumentDetails,
                paymentMetadata: paymentEntity ? (paymentEntity as any) : undefined,
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
                gatewayName: parsed.gatewayName,
                paymentChannel: parsed.paymentChannel,
                instrumentDetails: parsed.instrumentDetails,
                paymentMetadata: paymentEntity ? (paymentEntity as any) : undefined,
                verifiedAt: new Date(),
              },
            });
          }

          await tx.order.update({
            where: { id: order.id },
            data: {
              status: "CONFIRMED",
              paymentMethod: `ONLINE_GATEWAY (${parsed.gatewayName} · ${parsed.paymentChannel})`,
            },
          });

          // Clear cart
          if (order.userId) {
            const userCart = await tx.cart.findUnique({ where: { userId: order.userId } });
            if (userCart) {
              await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
            }
          }
        });

        // Trigger background invoices and notifications
        void (async () => {
          try {
            const fullOrder = await db.order.findUnique({
              where: { id: order.id },
              include: { user: true, items: true, payment: true },
            });

            if (fullOrder) {
              sendOrderPlacedEmail(fullOrder).catch(() => null);

              try {
                const { buffer, invoiceNumber } = await generateInvoiceBufferForOrder(order.id);
                const invoiceFilename = `FashionCart-Invoice-${order.orderNumber}-${invoiceNumber}.pdf`;
                sendPaymentVerifiedEmail(fullOrder, buffer, invoiceFilename).catch(() => null);
              } catch {
                sendPaymentVerifiedEmail(fullOrder).catch(() => null);
              }

              const phone = fullOrder.user.phone || (fullOrder.shippingAddressSnapshot as Record<string, string> | null)?.mobileNumber;
              if (phone) {
                sendMobileSms({
                  to: phone,
                  message: formatPaymentVerifiedSms(fullOrder),
                  templateType: "PAYMENT_VERIFIED",
                }).catch(() => null);
              }
            }
          } catch (e) {
            console.error("Webhook post-processing error:", e);
          }
        })();
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
  }
}
