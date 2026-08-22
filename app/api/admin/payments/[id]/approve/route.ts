import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { generateInvoiceBufferForOrder } from "@/lib/invoice/generate";
import { sendPaymentVerifiedEmail } from "@/lib/email/service";
import { sendMobileSms, formatPaymentVerifiedSms } from "@/lib/notifications/sms";

/**
 * Multi-Store Admin Endpoint: Moving payment to VERIFIED and order to CONFIRMED.
 * Generates PDF Tax Invoice and sends email & SMS notifications to customer.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let store: "garments" | "jewellery" = "garments";
  let db = getDb("garments");
  let payment = await db.payment.findUnique({ where: { id }, include: { order: true } });

  if (!payment) {
    const jwDb = getDb("jewellery");
    payment = await jwDb.payment.findUnique({ where: { id }, include: { order: true } });
    if (payment) {
      store = "jewellery";
      db = jwDb;
    }
  }

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "VERIFIED") {
    return NextResponse.json({ error: "Payment is already verified." }, { status: 400 });
  }
  if (!payment.screenshotPath && !payment.utrNumber) {
    return NextResponse.json(
      { error: "Cannot approve a payment with no screenshot or payment proof submitted." },
      { status: 400 }
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const verifiedPayment = await tx.payment.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedById: admin.id,
        rejectionReason: null,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });

    return verifiedPayment;
  });

  // Background invoice generation and notifications
  void (async () => {
    try {
      let invoiceBuffer: Buffer | undefined;
      let invoiceFilename: string | undefined;

      try {
        const { buffer, invoiceNumber } = await generateInvoiceBufferForOrder(payment.orderId);
        invoiceBuffer = buffer;
        invoiceFilename = `FashionCart-Invoice-${payment.order.orderNumber}-${invoiceNumber}.pdf`;
      } catch (err) {
        console.error("Invoice generation failed for order", payment.orderId, err);
      }

      const fullOrder = await db.order.findUnique({
        where: { id: payment.orderId },
        include: { user: true, items: true, payment: true },
      });

      if (fullOrder) {
        sendPaymentVerifiedEmail(fullOrder, invoiceBuffer, invoiceFilename).catch((emailErr) => {
          console.error("Payment verified email failed:", emailErr);
        });

        const phone = fullOrder.user.phone || (fullOrder.shippingAddressSnapshot as any)?.mobileNumber;
        if (phone) {
          sendMobileSms({
            to: phone,
            message: formatPaymentVerifiedSms(fullOrder),
            templateType: "PAYMENT_VERIFIED",
          }).catch((smsErr) => {
            console.error("Payment verified SMS failed:", smsErr);
          });
        }
      }
    } catch (bgErr) {
      console.error("Background payment approval notification error:", bgErr);
    }
  })();

  return NextResponse.json({ payment: updated });
}
