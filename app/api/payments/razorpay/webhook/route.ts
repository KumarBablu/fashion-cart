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

    // 1. Handle refund.processed and refund.created events
    if (event === "refund.processed" || event === "refund.created" || event === "refund.failed") {
      const refundEntity = payload?.payload?.refund?.entity;
      const paymentEntity = payload?.payload?.payment?.entity;

      const refundId = refundEntity?.id;
      const paymentId = refundEntity?.payment_id || paymentEntity?.id;
      const refundStatus = (refundEntity?.status || (event === "refund.processed" ? "PROCESSED" : "INITIATED")).toUpperCase();
      const refundArn = refundEntity?.acquirer_data?.arn || refundEntity?.acquirer_data?.rrn || null;
      const refundAmount = refundEntity?.amount ? Number(refundEntity.amount) / 100 : undefined;

      if (paymentId) {
        for (const storeName of ["garments", "jewellery"] as const) {
          const db = getDb(storeName);
          const payment = await db.payment.findFirst({
            where: {
              OR: [{ utrNumber: paymentId }, { refundId }],
            },
            include: { order: true },
          });

          if (payment) {
            const now = new Date();
            await db.payment.update({
              where: { id: payment.id },
              data: {
                refundId: refundId || payment.refundId,
                refundStatus,
                refundAmount: refundAmount || payment.refundAmount,
                refundArn: refundArn || payment.refundArn,
                refundCompletedAt: refundStatus === "PROCESSED" ? now : payment.refundCompletedAt,
              },
            });

            if (refundStatus === "PROCESSED" && payment.order) {
              await db.order.update({
                where: { id: payment.order.id },
                data: { status: "REFUNDED" },
              });
            }
            break;
          }
        }
      }

      return NextResponse.json({ status: "refund_updated", refundId });
    }

    // 2. Handle payment.captured and order.paid events
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;

      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const notes = paymentEntity?.notes || orderEntity?.notes || {};

      const orderNumber = notes.orderNumber || paymentEntity?.description || orderEntity?.receipt;
      const orderId = notes.orderId;
      const rawStore = notes.store;

      let store: "garments" | "jewellery" = rawStore === "jewellery" || rawStore === "Jewellery Atelier" ? "jewellery" : "garments";
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

        // Validate payment amount in integer paise against trusted server-side order.total
        const expectedPaise = Math.round(Number(order.total) * 100);
        const paidPaise = Number(paymentEntity?.amount);
        if (!paidPaise || paidPaise !== expectedPaise) {
          console.error("[Razorpay Webhook] Amount mismatch:", {
            paidPaise,
            expectedPaise,
            orderId: order.id,
          });
          return NextResponse.json(
            { error: "Payment amount mismatch with internal order total." },
            { status: 400 }
          );
        }

        // Validate currency
        if (paymentEntity?.currency && paymentEntity.currency.toUpperCase() !== "INR") {
          return NextResponse.json({ error: "Invalid payment currency." }, { status: 400 });
        }

        // Validate payment status
        if (paymentEntity?.status && paymentEntity.status !== "captured" && paymentEntity.status !== "authorized") {
          return NextResponse.json(
            { error: `Payment not captured. Status: ${paymentEntity.status}` },
            { status: 400 }
          );
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

          // Clear purchased items from user cart
          if (order.userId) {
            const orderWithItems = await tx.order.findUnique({
              where: { id: order.id },
              include: { items: true },
            });
            const purchasedVariantIds = (orderWithItems?.items || [])
              .map((i) => i.variantId)
              .filter((id): id is string => Boolean(id));

            const userCart = await tx.cart.findUnique({ where: { userId: order.userId } });
            if (userCart && purchasedVariantIds.length > 0) {
              await tx.cartItem.deleteMany({
                where: {
                  cartId: userCart.id,
                  variantId: { in: purchasedVariantIds },
                },
              });
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
