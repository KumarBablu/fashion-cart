// @ts-ignore
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/order-number";

/**
 * Generates an in-memory GST-compliant PDF invoice buffer for an order.
 * Runs completely in-memory, making it 100% compatible with Vercel and serverless functions.
 */
export async function generateInvoiceBufferForOrder(orderId: string): Promise<{
  buffer: Buffer;
  invoiceNumber: string;
  orderNumber: string;
}> {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  const invoiceNumber = existing?.invoiceNumber ?? (await generateInvoiceNumber());

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: true, payment: true },
  });

  const business = await prisma.businessSettings.findFirst();

  // Create invoice record in database if not yet present
  if (!existing) {
    await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        pdfPath: `invoices/${invoiceNumber}.pdf`,
      },
    }).catch(() => {
      // Catch in case of race condition
    });
  }

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const addr = order.shippingAddressSnapshot as {
      fullName: string;
      mobileNumber: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pinCode: string;
      landmark?: string;
    };

    // Header Banner Box
    doc.rect(40, 40, 515, 65).fill("#0C3B2E");

    doc.fillColor("#FFBA00").fontSize(20).text(business?.businessName || "FASHION CART", 55, 52, { characterSpacing: 1 });
    doc.fillColor("#FFFFFF").fontSize(9).text("OFFICIAL TAX INVOICE · RETAIL RECEIPT", 55, 76, { characterSpacing: 1.5 });
    doc.fillColor("#FFFFFF").fontSize(9).text(`Original for Recipient`, 420, 56, { align: "right" });
    doc.fillColor("#FFBA00").text(`Status: ${order.status}`, 420, 72, { align: "right" });

    // Business & Invoice Meta Row
    doc.fillColor("#1a1614");
    let y = 120;

    // Seller Info (Left)
    doc.fontSize(10).font("Helvetica-Bold").text("Sold By / Dispatcher:", 40, y);
    doc.fontSize(9).font("Helvetica").text(business?.businessName || "Fashion Cart Boutique", 40, y + 14);
    if (business?.businessAddress) doc.text(business.businessAddress, 40, y + 26, { width: 220 });
    if (business?.gstin) doc.text(`GSTIN: ${business.gstin}`, 40, y + 54);
    if (business?.phone) doc.text(`Contact: ${business.phone} · ${business?.email || ""}`, 40, y + 66);

    // Invoice Meta (Right)
    doc.fontSize(10).font("Helvetica-Bold").text("Invoice Details:", 320, y);
    doc.fontSize(9).font("Helvetica");
    doc.text(`Invoice No: ${invoiceNumber}`, 320, y + 14);
    doc.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, 320, y + 26);
    doc.text(`Order Number: ${order.orderNumber}`, 320, y + 38);
    doc.text(`Payment Method: ${order.paymentMethod.replace(/_/g, " ")}`, 320, y + 50);
    if (order.payment?.utrNumber) {
      doc.text(`Payment Ref (UTR): ${order.payment.utrNumber}`, 320, y + 62);
    }

    y = 205;
    doc.moveTo(40, y).lineTo(555, y).lineWidth(1).strokeColor("#e2e8f0").stroke();

    // Bill To & Ship To (Two Columns)
    y = 215;
    doc.fontSize(10).font("Helvetica-Bold").text("Billed & Shipped To:", 40, y);
    doc.fontSize(9).font("Helvetica");
    doc.text(addr.fullName, 40, y + 14);
    doc.text(addr.addressLine1, 40, y + 26);
    if (addr.addressLine2) doc.text(addr.addressLine2, 40, y + 38);
    doc.text(`${addr.city}, ${addr.state} - ${addr.pinCode}`, 40, addr.addressLine2 ? y + 50 : y + 38);
    doc.text(`Phone: ${addr.mobileNumber} · Email: ${order.user.email}`, 40, addr.addressLine2 ? y + 62 : y + 50);

    // Table Header
    const tableTop = 295;
    doc.rect(40, tableTop, 515, 22).fill("#f1f5f9");
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9);
    doc.text("Item / Description", 50, tableTop + 6);
    doc.text("SKU", 210, tableTop + 6);
    doc.text("Size/Colour", 280, tableTop + 6);
    doc.text("Qty", 365, tableTop + 6);
    doc.text("Rate", 415, tableTop + 6);
    doc.text("Amount", 485, tableTop + 6);

    let rowY = tableTop + 28;
    doc.font("Helvetica").fontSize(9).fillColor("#1a1614");

    for (const item of order.items) {
      doc.text(item.productNameSnapshot, 50, rowY, { width: 150 });
      doc.text(item.skuSnapshot, 210, rowY, { width: 65 });
      doc.text(`${item.sizeSnapshot} / ${item.colourSnapshot}`, 280, rowY, { width: 80 });
      doc.text(String(item.quantity), 365, rowY, { width: 30 });
      doc.text(`INR ${Number(item.unitPrice).toFixed(2)}`, 415, rowY, { width: 60 });
      doc.text(`INR ${Number(item.total).toFixed(2)}`, 485, rowY, { width: 65 });
      rowY += 22;
    }

    doc.moveTo(40, rowY + 5).lineTo(555, rowY + 5).lineWidth(1).strokeColor("#cbd5e1").stroke();
    rowY += 15;

    // Summary Section
    const summaryLine = (label: string, value: string, bold = false) => {
      if (bold) {
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a");
      } else {
        doc.font("Helvetica").fontSize(9).fillColor("#475569");
      }
      doc.text(label, 320, rowY, { width: 140, align: "right" });
      doc.text(value, 475, rowY, { width: 75, align: "right" });
      rowY += 16;
    };

    summaryLine("Items Subtotal:", `INR ${Number(order.subtotal).toFixed(2)}`);

    if (Number(order.discount) > 0) {
      summaryLine(`Discount ${order.couponCode ? `(${order.couponCode})` : ""}:`, `- INR ${Number(order.discount).toFixed(2)}`);
    }

    summaryLine("Shipping & Handling:", Number(order.deliveryCharge) === 0 ? "FREE" : `INR ${Number(order.deliveryCharge).toFixed(2)}`);
    summaryLine("Applicable Taxes (GST):", `INR ${Number(order.tax).toFixed(2)}`);

    rowY += 4;
    doc.rect(320, rowY, 235, 24).fill("#f8fafc");
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11);
    doc.text("Total Paid / Payable:", 330, rowY + 7, { width: 130, align: "right" });
    doc.text(`INR ${Number(order.total).toFixed(2)}`, 465, rowY + 7, { width: 85, align: "right" });

    // Footer & Disclaimer
    const footerY = 700;
    doc.moveTo(40, footerY).lineTo(555, footerY).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
    doc.font("Helvetica").fontSize(8).fillColor("#94a3b8");
    doc.text(
      "Thank you for shopping with Fashion Cart! For any assistance, returns, or order queries, please reach out to us at support@fashioncart.shop.",
      40,
      footerY + 10,
      { align: "center", width: 515 }
    );
    doc.text(
      "This is a computer-generated invoice and requires no physical signature.",
      40,
      footerY + 22,
      { align: "center", width: 515 }
    );

    doc.end();
  });

  return { buffer, invoiceNumber, orderNumber: order.orderNumber };
}

// Backward compatibility alias
export async function generateInvoiceForOrder(orderId: string): Promise<string> {
  const { invoiceNumber } = await generateInvoiceBufferForOrder(orderId);
  return `invoices/${invoiceNumber}.pdf`;
}
