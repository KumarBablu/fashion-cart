import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";
import { generateInvoiceForOrder } from "@/lib/invoice/generate";
import { sendPaymentVerifiedEmail } from "@/lib/email/service";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Endpoint moving payment to VERIFIED and order to CONFIRMED.
 * Generates PDF Tax Invoice and sends email notification to customer with invoice.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({ where: { id }, include: { order: true } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "VERIFIED") {
    return NextResponse.json({ error: "Payment is already verified." }, { status: 400 });
  }
  if (!payment.screenshotPath || !payment.utrNumber) {
    return NextResponse.json(
      { error: "Cannot approve a payment with no screenshot/UTR submitted." },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
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

  // Generate the invoice now that payment is confirmed
  let invoiceBuffer: Buffer | undefined;
  let invoiceFilename: string | undefined;

  try {
    const invoiceRelPath = await generateInvoiceForOrder(payment.orderId);
    const fullPdfPath = path.join(process.cwd(), "uploads", invoiceRelPath);
    invoiceBuffer = await readFile(fullPdfPath);
    invoiceFilename = path.basename(invoiceRelPath);
  } catch (err) {
    console.error("Invoice generation failed for order", payment.orderId, err);
  }

  // Fetch full order to dispatch customer email
  const fullOrder = await prisma.order.findUnique({
    where: { id: payment.orderId },
    include: { user: true, items: true, payment: true },
  });

  if (fullOrder) {
    sendPaymentVerifiedEmail(fullOrder, invoiceBuffer, invoiceFilename).catch((emailErr) => {
      console.error("Payment verified email failed:", emailErr);
    });
  }

  return NextResponse.json({ payment: updated });
}
