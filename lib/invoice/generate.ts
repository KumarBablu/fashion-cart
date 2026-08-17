import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/order-number";
import { formatINR } from "@/lib/format";

/**
 * Generates an in-memory GST-compliant PDF invoice buffer for an order using pdf-lib.
 * 100% web-standards, zero-filesystem dependencies, perfectly compatible with Vercel serverless.
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
    await prisma.invoice
      .create({
        data: {
          orderId,
          invoiceNumber,
          pdfPath: `invoices/${invoiceNumber}.pdf`,
        },
      })
      .catch(() => {
        // Catch in case of race condition
      });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (points)
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Luxury Color Palette (Atelier Noir & Champagne Royal Gold)
  const brandDark = rgb(20 / 255, 20 / 255, 22 / 255); // #141416 Obsidian Noir
  const goldAccent = rgb(197 / 255, 155 / 255, 39 / 255); // #C59B27 Champagne Tuscan Gold
  const textDark = rgb(20 / 255, 20 / 255, 22 / 255);
  const textMuted = rgb(120 / 255, 124 / 255, 135 / 255);
  const bgLight = rgb(250 / 255, 248 / 255, 245 / 255);
  const lineBorder = rgb(231 / 255, 223 / 255, 213 / 255);

  const addr = order.shippingAddressSnapshot as {
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
  };

  // 1. Header Banner Box
  page.drawRectangle({
    x: 36,
    y: height - 100,
    width: width - 72,
    height: 64,
    color: brandDark,
  });

  page.drawText(business?.businessName || "FASHION CART", {
    x: 52,
    y: height - 60,
    size: 18,
    font: fontBold,
    color: goldAccent,
  });

  page.drawText("OFFICIAL GST TAX INVOICE · RETAIL RECEIPT", {
    x: 52,
    y: height - 80,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Original for Recipient", {
    x: width - 170,
    y: height - 60,
    size: 9,
    font: fontRegular,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Status: ${order.status}`, {
    x: width - 170,
    y: height - 76,
    size: 9,
    font: fontBold,
    color: goldAccent,
  });

  // 2. Business & Invoice Details Meta Grid
  let currentY = height - 130;

  // Left Column: Seller Info
  page.drawText("Sold By / Dispatcher:", { x: 36, y: currentY, size: 9, font: fontBold, color: textDark });
  page.drawText(business?.businessName || "Fashion Cart Boutique", { x: 36, y: currentY - 14, size: 8, font: fontRegular, color: textDark });
  if (business?.businessAddress) {
    page.drawText(business.businessAddress.slice(0, 50), { x: 36, y: currentY - 26, size: 8, font: fontRegular, color: textMuted });
  }
  page.drawText(`GSTIN: ${business?.gstin || "29AAAAA0000A1Z5"}`, { x: 36, y: currentY - 38, size: 8, font: fontBold, color: textDark });
  page.drawText(`Contact: ${business?.phone || "9771039201"} · ${business?.email || "bablusoni2825@gmail.com"}`, {
    x: 36,
    y: currentY - 50,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  // Right Column: Invoice Details
  const rightColX = 330;
  page.drawText("Invoice Details:", { x: rightColX, y: currentY, size: 9, font: fontBold, color: textDark });
  page.drawText(`Invoice No: ${invoiceNumber}`, { x: rightColX, y: currentY - 14, size: 8, font: fontBold, color: brandDark });
  page.drawText(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { x: rightColX, y: currentY - 26, size: 8, font: fontRegular, color: textDark });
  page.drawText(`Order ID: #${order.orderNumber}`, { x: rightColX, y: currentY - 38, size: 8, font: fontRegular, color: textDark });
  page.drawText(`Payment: ${order.paymentMethod.replace(/_/g, " ")}${order.payment?.utrNumber ? ` (UTR: ${order.payment.utrNumber})` : ""}`, {
    x: rightColX,
    y: currentY - 50,
    size: 8,
    font: fontRegular,
    color: textDark,
  });

  // Divider Line
  currentY -= 68;
  page.drawLine({
    start: { x: 36, y: currentY },
    end: { x: width - 36, y: currentY },
    thickness: 1,
    color: lineBorder,
  });

  // 3. Customer Billing & Shipping Address
  currentY -= 18;
  page.drawText("Billed & Shipped To (Customer):", { x: 36, y: currentY, size: 9, font: fontBold, color: textDark });
  currentY -= 14;
  page.drawText(`${addr.fullName} · Phone: ${addr.mobileNumber}`, { x: 36, y: currentY, size: 8, font: fontBold, color: textDark });
  currentY -= 12;
  page.drawText(`${addr.addressLine1}${addr.addressLine2 ? `, ${addr.addressLine2}` : ""}`, { x: 36, y: currentY, size: 8, font: fontRegular, color: textMuted });
  currentY -= 12;
  page.drawText(`${addr.city}, ${addr.state} - ${addr.pinCode} · Email: ${order.user.email}`, { x: 36, y: currentY, size: 8, font: fontRegular, color: textMuted });

  // 4. Line Items Table Header
  currentY -= 24;
  page.drawRectangle({
    x: 36,
    y: currentY - 18,
    width: width - 72,
    height: 20,
    color: bgLight,
    borderColor: lineBorder,
    borderWidth: 1,
  });

  page.drawText("ITEM DESCRIPTION", { x: 44, y: currentY - 12, size: 8, font: fontBold, color: textDark });
  page.drawText("SKU / SIZE", { x: 260, y: currentY - 12, size: 8, font: fontBold, color: textDark });
  page.drawText("QTY", { x: 360, y: currentY - 12, size: 8, font: fontBold, color: textDark });
  page.drawText("PRICE", { x: 420, y: currentY - 12, size: 8, font: fontBold, color: textDark });
  page.drawText("TOTAL", { x: 490, y: currentY - 12, size: 8, font: fontBold, color: textDark });

  currentY -= 26;

  // 5. Items Rows
  for (const item of order.items) {
    page.drawText(item.productNameSnapshot.slice(0, 36), { x: 44, y: currentY, size: 8, font: fontBold, color: textDark });
    page.drawText(`${item.skuSnapshot} / ${item.sizeSnapshot}`, { x: 260, y: currentY, size: 8, font: fontRegular, color: textMuted });
    page.drawText(`${item.quantity}`, { x: 368, y: currentY, size: 8, font: fontRegular, color: textDark });
    page.drawText(`INR ${Number(item.unitPrice).toLocaleString("en-IN")}`, { x: 420, y: currentY, size: 8, font: fontRegular, color: textDark });
    page.drawText(`INR ${Number(item.total).toLocaleString("en-IN")}`, { x: 490, y: currentY, size: 8, font: fontBold, color: textDark });

    currentY -= 18;
  }

  // Divider Line before totals
  currentY -= 8;
  page.drawLine({
    start: { x: 36, y: currentY },
    end: { x: width - 36, y: currentY },
    thickness: 1,
    color: lineBorder,
  });

  // 6. Totals & Tax Breakdown Box
  currentY -= 16;
  const totalsX = 350;

  page.drawText("Subtotal:", { x: totalsX, y: currentY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(`INR ${Number(order.subtotal).toLocaleString("en-IN")}`, { x: 490, y: currentY, size: 8, font: fontRegular, color: textDark });
  currentY -= 14;

  if (Number(order.discount) > 0) {
    page.drawText(`Discount (${order.couponCode || "Coupon"}):`, { x: totalsX, y: currentY, size: 8, font: fontRegular, color: rgb(220 / 255, 38 / 255, 38 / 255) });
    page.drawText(`- INR ${Number(order.discount).toLocaleString("en-IN")}`, { x: 490, y: currentY, size: 8, font: fontBold, color: rgb(220 / 255, 38 / 255, 38 / 255) });
    currentY -= 14;
  }

  page.drawText("Shipping / Delivery:", { x: totalsX, y: currentY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(Number(order.deliveryCharge) === 0 ? "FREE" : `INR ${Number(order.deliveryCharge).toLocaleString("en-IN")}`, {
    x: 490,
    y: currentY,
    size: 8,
    font: fontRegular,
    color: textDark,
  });
  currentY -= 14;

  const taxAmount = Number(order.tax);
  const halfTax = (taxAmount / 2).toFixed(2);
  page.drawText(`Integrated CGST (9%) + SGST (9%):`, { x: totalsX, y: currentY, size: 8, font: fontRegular, color: textMuted });
  page.drawText(`INR ${Number(halfTax) * 2}`, { x: 490, y: currentY, size: 8, font: fontRegular, color: textDark });
  currentY -= 18;

  // Grand Total Banner
  page.drawRectangle({
    x: totalsX - 10,
    y: currentY - 6,
    width: width - totalsX - 26,
    height: 24,
    color: brandDark,
  });

  page.drawText("GRAND TOTAL:", { x: totalsX, y: currentY + 1, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(`INR ${Number(order.total).toLocaleString("en-IN")}`, { x: 480, y: currentY + 1, size: 10, font: fontBold, color: goldAccent });

  // 7. Footer Terms & Authenticity Seal
  page.drawText("TERMS & CONDITIONS:", { x: 36, y: 80, size: 7, font: fontBold, color: textDark });
  page.drawText("1. Goods once sold are eligible for replacement or return within 7 calendar days as per store policy.", { x: 36, y: 70, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText("2. This is a computer-generated tax invoice and requires no physical signature under Indian Information Technology Act.", { x: 36, y: 60, size: 6.5, font: fontRegular, color: textMuted });
  page.drawText("Fashion Cart Luxury Atelier · Designed for comfort & everyday elegance · support@fashioncart.shop", { x: 36, y: 46, size: 6.5, font: fontBold, color: brandDark });

  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return {
    buffer,
    invoiceNumber,
    orderNumber: order.orderNumber,
  };
}
